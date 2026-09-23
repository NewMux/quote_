-- Round 27: atomic money operations + recurring invoices.
--
-- Multi-step writes (logging a payment, converting an estimate, saving a document's lines,
-- reserving a document number, wiping data) used to be sequences of separate PostgREST calls —
-- a dropped connection partway through could leave an invoice's balance or status wrong. Each is
-- now a single Postgres function, so it runs in one transaction.
--
-- Conventions:
-- * Internal helpers live in the `private` schema, which PostgREST does not expose.
-- * Every function is SECURITY INVOKER, so the existing owner-scoped RLS policies still guard
--   every row an app user touches. Public RPCs take the owner from auth.uid(), never a parameter.
--   The recurring-invoice cron job runs as `postgres` (bypasses RLS) and calls the same helpers.
-- * Timestamps are written in the same ISO-8601 text format the app's nowIso() produces.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------

-- clock_timestamp(), not now(): now() is fixed for the whole transaction, which would give two
-- activity rows written by one function (e.g. "payment logged" then "status changed") identical
-- timestamps and an undefined display order.
create or replace function private.now_iso()
returns text
language sql
volatile
set search_path = ''
as $$
  select to_char(clock_timestamp() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

-- Always computed from the schedule's start date, never by adding to the previous run date, so
-- month-end schedules don't drift (Jan 31 -> Feb 28 -> Mar 31, not Feb 28 -> Mar 28).
create or replace function private.recurrence_date(p_start text, p_frequency text, p_n integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select to_char(
    p_start::date + case p_frequency
      when 'weekly' then make_interval(weeks => p_n)
      when 'monthly' then make_interval(months => p_n)
      when 'quarterly' then make_interval(months => 3 * p_n)
      when 'yearly' then make_interval(years => p_n)
    end,
    'YYYY-MM-DD'
  )
$$;

-- One atomic upsert instead of the old read-then-write, so two quick creates can never be handed
-- the same number. Formatting mirrors src/lib/docNumber.ts, including never truncating a
-- sequence longer than the configured padding (lpad alone would truncate).
create or replace function private.reserve_doc_number(p_owner uuid, p_doc_type text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile business_profile%rowtype;
  v_year integer;
  v_prefix text;
  v_seq integer;
  v_seq_text text;
begin
  select * into v_profile from business_profile where id = p_owner;
  if not found then
    raise exception 'Business profile not found';
  end if;

  v_year := case when v_profile.reset_numbering_yearly <> 0 then extract(year from now())::integer else 0 end;
  v_prefix := case when p_doc_type = 'estimate' then v_profile.estimate_prefix else v_profile.invoice_prefix end;

  insert into doc_counters (owner_id, doc_type, year_bucket, next_number)
  values (p_owner, p_doc_type, v_year, 2)
  on conflict (owner_id, doc_type, year_bucket)
  do update set next_number = doc_counters.next_number + 1
  returning next_number - 1 into v_seq;

  v_seq_text := v_seq::text;
  if length(v_seq_text) < v_profile.number_padding then
    v_seq_text := lpad(v_seq_text, v_profile.number_padding, '0');
  end if;

  return v_prefix || case when v_year > 0 then v_year::text || '-' else '' end || v_seq_text;
end;
$$;

-- Recomputes amount_paid_minor from settlements and moves the status between issued /
-- partially_paid / paid — the same rules the app used to apply client-side. Locks the document
-- row so concurrent payment writes on one invoice serialize.
create or replace function private.recalculate_document_payment(p_document_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_doc documents%rowtype;
  v_paid integer;
  v_status text;
begin
  select * into v_doc from documents where id = p_document_id for update;
  if not found then
    raise exception 'Document not found';
  end if;

  select coalesce(sum(amount_minor), 0) into v_paid from settlements where document_id = p_document_id;

  v_status := v_doc.status;
  if v_paid >= v_doc.total_minor and v_doc.total_minor > 0 then
    v_status := 'paid';
  elsif v_paid > 0 then
    v_status := 'partially_paid';
  elsif v_doc.status in ('paid', 'partially_paid') then
    v_status := 'issued';
  end if;

  update documents
  set amount_paid_minor = v_paid, status = v_status, updated_at = private.now_iso()
  where id = p_document_id;

  if v_status <> v_doc.status then
    insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
    values (v_doc.owner_id, p_document_id, 'status_changed', v_status, private.now_iso());
  end if;

  return jsonb_build_object(
    'status', v_status,
    'doc_type', v_doc.doc_type,
    'doc_number', v_doc.doc_number,
    'due_date', v_doc.due_date
  );
end;
$$;

-- Copies a document's header, totals and line items into a new draft. Shared by estimate ->
-- invoice conversion and recurring-invoice generation.
create or replace function private.copy_document_into(
  p_source_id uuid,
  p_doc_type text,
  p_doc_number text,
  p_due_date text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_src documents%rowtype;
  v_id uuid := gen_random_uuid();
  v_now text := private.now_iso();
begin
  select * into v_src from documents where id = p_source_id;
  if not found then
    raise exception 'Document not found';
  end if;

  insert into documents (
    id, owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, due_date,
    currency_code, notes, terms_override, discount_type, discount_value, subtotal_minor,
    discount_amount_minor, tax_total_minor, total_minor, created_at, updated_at
  )
  values (
    v_id, v_src.owner_id, p_doc_type, p_doc_number, 'draft', v_src.client_id,
    v_src.client_name_snapshot, p_due_date, v_src.currency_code, v_src.notes,
    v_src.terms_override, v_src.discount_type, v_src.discount_value, v_src.subtotal_minor,
    v_src.discount_amount_minor, v_src.tax_total_minor, v_src.total_minor, v_now, v_now
  );

  insert into line_items (
    owner_id, document_id, catalog_item_id, position, description, quantity, unit_label,
    unit_price_minor, discount_type, discount_value, is_taxable, tax_bracket_id,
    tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_discount_minor,
    line_tax_minor, line_total_minor, created_at, updated_at
  )
  select
    owner_id, v_id, catalog_item_id, position, description, quantity, unit_label,
    unit_price_minor, discount_type, discount_value, is_taxable, tax_bracket_id,
    tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_discount_minor,
    line_tax_minor, line_total_minor, v_now, v_now
  from line_items
  where document_id = p_source_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Public RPCs (called from the app)
-- ---------------------------------------------------------------------------------------------

create or replace function public.reserve_doc_number(p_doc_type text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  return private.reserve_doc_number(auth.uid(), p_doc_type);
end;
$$;

-- Totals are computed client-side by computeDocumentTotals (src/lib/documentCalculations.ts) and
-- passed in; this function makes the line replacement and header update land together.
create or replace function public.save_document_edit(p_document_id uuid, p_header jsonb, p_lines jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now text := private.now_iso();
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  update documents
  set
    client_id = (p_header->>'client_id')::uuid,
    client_name_snapshot = p_header->>'client_name_snapshot',
    issue_date = p_header->>'issue_date',
    due_date = p_header->>'due_date',
    expiry_date = p_header->>'expiry_date',
    notes = p_header->>'notes',
    terms_override = p_header->>'terms_override',
    discount_type = p_header->>'discount_type',
    discount_value = (p_header->>'discount_value')::integer,
    subtotal_minor = (p_header->>'subtotal_minor')::integer,
    discount_amount_minor = (p_header->>'discount_amount_minor')::integer,
    tax_total_minor = (p_header->>'tax_total_minor')::integer,
    total_minor = (p_header->>'total_minor')::integer,
    updated_at = v_now
  where id = p_document_id;
  if not found then
    raise exception 'Document not found';
  end if;

  delete from line_items where document_id = p_document_id;

  insert into line_items (
    id, owner_id, document_id, catalog_item_id, position, description, quantity, unit_label,
    unit_price_minor, discount_type, discount_value, is_taxable, tax_bracket_id,
    tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_discount_minor,
    line_tax_minor, line_total_minor, created_at, updated_at
  )
  select
    coalesce(l.id, gen_random_uuid()), auth.uid(), p_document_id, l.catalog_item_id, l.position,
    l.description, l.quantity, l.unit_label, l.unit_price_minor, l.discount_type,
    l.discount_value, l.is_taxable, l.tax_bracket_id, l.tax_bracket_name_snapshot, l.tax_rate_bp,
    l.line_subtotal_minor, l.line_discount_minor, l.line_tax_minor, l.line_total_minor, v_now, v_now
  from jsonb_to_recordset(p_lines) as l(
    id uuid, catalog_item_id uuid, position integer, description text, quantity real,
    unit_label text, unit_price_minor integer, discount_type text, discount_value integer,
    is_taxable integer, tax_bracket_id uuid, tax_bracket_name_snapshot text, tax_rate_bp integer,
    line_subtotal_minor integer, line_discount_minor integer, line_tax_minor integer,
    line_total_minor integer
  );

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (auth.uid(), p_document_id, 'edited', null, private.now_iso());
end;
$$;

create or replace function public.create_settlement(
  p_document_id uuid,
  p_method text,
  p_amount_minor integer,
  p_settled_date text,
  p_reference_number text,
  p_receipt_photo_uri text,
  p_notes text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into settlements (
    owner_id, document_id, method, amount_minor, settled_date, reference_number,
    receipt_photo_uri, notes, created_at
  )
  values (
    auth.uid(), p_document_id, p_method, p_amount_minor, p_settled_date, p_reference_number,
    p_receipt_photo_uri, p_notes, private.now_iso()
  );

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (auth.uid(), p_document_id, 'settlement_logged', null, private.now_iso());

  return private.recalculate_document_payment(p_document_id);
end;
$$;

create or replace function public.update_settlement(
  p_settlement_id uuid,
  p_method text,
  p_amount_minor integer,
  p_settled_date text,
  p_reference_number text,
  p_receipt_photo_uri text,
  p_notes text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_document_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  update settlements
  set
    method = p_method,
    amount_minor = p_amount_minor,
    settled_date = p_settled_date,
    reference_number = p_reference_number,
    receipt_photo_uri = p_receipt_photo_uri,
    notes = p_notes
  where id = p_settlement_id
  returning document_id into v_document_id;
  if v_document_id is null then
    raise exception 'Payment not found';
  end if;

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (auth.uid(), v_document_id, 'settlement_logged', 'updated', private.now_iso());

  return private.recalculate_document_payment(v_document_id);
end;
$$;

create or replace function public.delete_settlement(p_settlement_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_document_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  delete from settlements where id = p_settlement_id returning document_id into v_document_id;
  if v_document_id is null then
    raise exception 'Payment not found';
  end if;

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (auth.uid(), v_document_id, 'settlement_logged', 'deleted', private.now_iso());

  return private.recalculate_document_payment(v_document_id);
end;
$$;

-- Locks the estimate so a double-tap can't convert it twice.
create or replace function public.convert_estimate_to_invoice(p_estimate_id uuid, p_due_date text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_est documents%rowtype;
  v_invoice_id uuid;
  v_number text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_est from documents where id = p_estimate_id for update;
  if not found then
    raise exception 'Estimate not found';
  end if;
  if v_est.doc_type <> 'estimate' then
    raise exception 'Document is not an estimate';
  end if;
  if v_est.converted_to_document_id is not null then
    raise exception 'This estimate has already been converted to an invoice';
  end if;

  v_number := private.reserve_doc_number(v_est.owner_id, 'invoice');
  v_invoice_id := private.copy_document_into(v_est.id, 'invoice', v_number, p_due_date);

  update documents set converted_from_document_id = v_est.id where id = v_invoice_id;
  update documents
  set converted_to_document_id = v_invoice_id, updated_at = private.now_iso()
  where id = v_est.id;

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (v_est.owner_id, v_est.id, 'converted_to_invoice', v_number, private.now_iso());
  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (v_est.owner_id, v_invoice_id, 'created', 'Converted from estimate ' || v_est.doc_number, private.now_iso());

  return v_invoice_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Recurring invoices
-- ---------------------------------------------------------------------------------------------

create table recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  template_document_id uuid not null references documents(id) on delete cascade,
  frequency text not null check (frequency in ('weekly','monthly','quarterly','yearly')),
  start_date text not null,
  next_run_date text not null,
  runs_count integer not null default 0,
  is_active integer not null default 1,
  created_at text not null,
  updated_at text not null
);
create unique index idx_recurring_schedules_template on recurring_schedules(template_document_id);
create index idx_recurring_schedules_owner_id on recurring_schedules(owner_id);
create index idx_recurring_schedules_due on recurring_schedules(next_run_date) where is_active = 1;
alter table recurring_schedules enable row level security;
create policy "owner full access" on recurring_schedules for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Creates a draft invoice for every schedule that has come due (all owners when called by the
-- cron job; one owner when called from the app). Catches up at most 12 missed periods per call.
-- SKIP LOCKED means the cron job and an app-launch call racing on the same schedule can never
-- both generate the same period.
create or replace function private.generate_due_recurring_invoices(p_owner uuid default null)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sched recurring_schedules%rowtype;
  v_tpl documents%rowtype;
  v_terms integer;
  v_number text;
  v_new_id uuid;
  v_count integer := 0;
  v_iter integer;
  v_today text := to_char(current_date, 'YYYY-MM-DD');
begin
  for v_sched in
    select * from recurring_schedules
    where is_active = 1
      and next_run_date <= v_today
      and (p_owner is null or owner_id = p_owner)
    for update skip locked
  loop
    select * into v_tpl from documents where id = v_sched.template_document_id;
    if not found or v_tpl.doc_type <> 'invoice' or v_tpl.status = 'void' then
      continue;
    end if;

    select default_payment_terms_days into v_terms from business_profile where id = v_sched.owner_id;

    v_iter := 0;
    while v_sched.next_run_date <= v_today and v_iter < 12 loop
      v_number := private.reserve_doc_number(v_sched.owner_id, 'invoice');
      v_new_id := private.copy_document_into(
        v_tpl.id,
        'invoice',
        v_number,
        to_char(v_sched.next_run_date::date + coalesce(v_terms, 14), 'YYYY-MM-DD')
      );
      insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
      values (v_sched.owner_id, v_new_id, 'created', 'Recurring from ' || v_tpl.doc_number, private.now_iso());

      v_sched.runs_count := v_sched.runs_count + 1;
      v_sched.next_run_date := private.recurrence_date(v_sched.start_date, v_sched.frequency, v_sched.runs_count);
      v_count := v_count + 1;
      v_iter := v_iter + 1;
    end loop;

    update recurring_schedules
    set runs_count = v_sched.runs_count, next_run_date = v_sched.next_run_date, updated_at = private.now_iso()
    where id = v_sched.id;
  end loop;

  return v_count;
end;
$$;

create or replace function public.generate_my_recurring_invoices()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  return private.generate_due_recurring_invoices(auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Delete All Data
-- ---------------------------------------------------------------------------------------------

create or replace function public.wipe_all_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now text := private.now_iso();
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  delete from recurring_schedules where owner_id = v_uid;
  delete from activity_logs where owner_id = v_uid;
  delete from settlements where owner_id = v_uid;
  delete from signatures where owner_id = v_uid;
  delete from line_items where owner_id = v_uid;
  delete from documents where owner_id = v_uid;
  delete from clients where owner_id = v_uid;
  delete from item_catalog where owner_id = v_uid;
  delete from tax_brackets where owner_id = v_uid;
  delete from doc_counters where owner_id = v_uid;

  update business_profile
  set
    business_name = '',
    logo_uri = null,
    accent_color = '#2563EB',
    email = null,
    phone = null,
    address = null,
    tax_registration_number = null,
    payment_instructions = null,
    footer_terms = null,
    default_currency_code = 'USD',
    default_payment_terms_days = 14,
    estimate_prefix = 'EST-',
    invoice_prefix = 'INV-',
    number_padding = 3,
    reset_numbering_yearly = 0,
    updated_at = v_now
  where id = v_uid;

  insert into tax_brackets (owner_id, name, rate_bp, is_default, created_at, updated_at)
  values (v_uid, 'No Tax', 0, 1, v_now, v_now);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Privileges: Postgres (and Supabase's default privileges) grant EXECUTE broadly on new
-- functions. Only signed-in users may call the public RPCs; the private helpers are callable by
-- authenticated only so the public RPCs (which run as the caller) can reach them — PostgREST
-- never exposes the private schema directly.
-- ---------------------------------------------------------------------------------------------

revoke all on function public.reserve_doc_number(text) from public, anon;
revoke all on function public.save_document_edit(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.create_settlement(uuid, text, integer, text, text, text, text) from public, anon;
revoke all on function public.update_settlement(uuid, text, integer, text, text, text, text) from public, anon;
revoke all on function public.delete_settlement(uuid) from public, anon;
revoke all on function public.convert_estimate_to_invoice(uuid, text) from public, anon;
revoke all on function public.generate_my_recurring_invoices() from public, anon;
revoke all on function public.wipe_all_data() from public, anon;

grant execute on function public.reserve_doc_number(text) to authenticated;
grant execute on function public.save_document_edit(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.create_settlement(uuid, text, integer, text, text, text, text) to authenticated;
grant execute on function public.update_settlement(uuid, text, integer, text, text, text, text) to authenticated;
grant execute on function public.delete_settlement(uuid) to authenticated;
grant execute on function public.convert_estimate_to_invoice(uuid, text) to authenticated;
grant execute on function public.generate_my_recurring_invoices() to authenticated;
grant execute on function public.wipe_all_data() to authenticated;

revoke all on function private.now_iso() from public, anon;
revoke all on function private.recurrence_date(text, text, integer) from public, anon;
revoke all on function private.reserve_doc_number(uuid, text) from public, anon;
revoke all on function private.recalculate_document_payment(uuid) from public, anon;
revoke all on function private.copy_document_into(uuid, text, text, text) from public, anon;
revoke all on function private.generate_due_recurring_invoices(uuid) from public, anon;

grant execute on function private.now_iso() to authenticated;
grant execute on function private.recurrence_date(text, text, integer) to authenticated;
grant execute on function private.reserve_doc_number(uuid, text) to authenticated;
grant execute on function private.recalculate_document_payment(uuid) to authenticated;
grant execute on function private.copy_document_into(uuid, text, text, text) to authenticated;
grant execute on function private.generate_due_recurring_invoices(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Daily generation job (06:00 UTC). The app also calls generate_my_recurring_invoices() on
-- launch and after saving a schedule, so drafts appear promptly even between cron runs.
-- ---------------------------------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule(
  'generate-recurring-invoices',
  '0 6 * * *',
  $$select private.generate_due_recurring_invoices()$$
);
