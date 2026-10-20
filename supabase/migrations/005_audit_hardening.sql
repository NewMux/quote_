-- Audit hardening (October 2026).
--
-- 1. Money columns become bigint. integer capped amounts at 2,147,483,647 minor units — about
--    Rp 21.4M (US$1,300) in IDR, which uses two decimals — so larger invoices failed to save.
-- 2. Child rows (line items, signatures, payments, activity, recurring schedules) must belong to
--    the same owner as their document. RLS only checked owner_id, and foreign-key checks ignore
--    RLS, so a row owned by one user could point at another user's document.
-- 3. The server enforces the document rules the app already follows: only drafts can be edited,
--    payments go on issued invoices and must be positive, and recalculating payments never moves
--    a document out of draft or void.
-- 4. One failing recurring schedule no longer aborts the nightly run for every user.
-- 5. Reserving a number skips any that already exist (identical prefixes, or toggling the yearly
--    reset, used to hand out numbers already taken).
-- 6. Delete All Data also clears the payment link added in 004.
--
-- Everything here stays compatible with the app build already on the App Store.

-- ---------------------------------------------------------------------------------------------
-- 1. bigint money
-- ---------------------------------------------------------------------------------------------

alter table public.documents
  alter column discount_value type bigint,
  alter column subtotal_minor type bigint,
  alter column discount_amount_minor type bigint,
  alter column tax_total_minor type bigint,
  alter column total_minor type bigint,
  alter column amount_paid_minor type bigint;

alter table public.line_items
  alter column unit_price_minor type bigint,
  alter column discount_value type bigint,
  alter column line_subtotal_minor type bigint,
  alter column line_discount_minor type bigint,
  alter column line_tax_minor type bigint,
  alter column line_total_minor type bigint;

alter table public.item_catalog alter column default_unit_price_minor type bigint;
alter table public.settlements alter column amount_minor type bigint;

-- ---------------------------------------------------------------------------------------------
-- 2. Child rows share their document's owner
-- ---------------------------------------------------------------------------------------------

alter table public.documents add constraint documents_id_owner_key unique (id, owner_id);

alter table public.line_items
  drop constraint line_items_document_id_fkey,
  add constraint line_items_document_owner_fkey
    foreign key (document_id, owner_id) references public.documents(id, owner_id) on delete cascade;

alter table public.signatures
  drop constraint signatures_document_id_fkey,
  add constraint signatures_document_owner_fkey
    foreign key (document_id, owner_id) references public.documents(id, owner_id) on delete cascade;

alter table public.settlements
  drop constraint settlements_document_id_fkey,
  add constraint settlements_document_owner_fkey
    foreign key (document_id, owner_id) references public.documents(id, owner_id) on delete cascade;

alter table public.activity_logs
  drop constraint activity_logs_document_id_fkey,
  add constraint activity_logs_document_owner_fkey
    foreign key (document_id, owner_id) references public.documents(id, owner_id) on delete cascade;

alter table public.recurring_schedules
  drop constraint recurring_schedules_template_document_id_fkey,
  add constraint recurring_schedules_template_owner_fkey
    foreign key (template_document_id, owner_id) references public.documents(id, owner_id) on delete cascade;

-- ---------------------------------------------------------------------------------------------
-- 3. Document rules
-- ---------------------------------------------------------------------------------------------

create or replace function public.save_document_edit(p_document_id uuid, p_header jsonb, p_lines jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now text := private.now_iso();
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select status into v_status from documents where id = p_document_id for update;
  if not found then
    raise exception 'Document not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'Only drafts can be edited';
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
    -- Only touch the override when the client sends it, so older app versions that don't know
    -- about payment links can't wipe one out on save.
    payment_link = case
      when p_header ? 'payment_link' then nullif(btrim(p_header->>'payment_link'), '')
      else payment_link
    end,
    discount_type = p_header->>'discount_type',
    discount_value = (p_header->>'discount_value')::bigint,
    subtotal_minor = (p_header->>'subtotal_minor')::bigint,
    discount_amount_minor = (p_header->>'discount_amount_minor')::bigint,
    tax_total_minor = (p_header->>'tax_total_minor')::bigint,
    total_minor = (p_header->>'total_minor')::bigint,
    updated_at = v_now
  where id = p_document_id;

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
    unit_label text, unit_price_minor bigint, discount_type text, discount_value bigint,
    is_taxable integer, tax_bracket_id uuid, tax_bracket_name_snapshot text, tax_rate_bp integer,
    line_subtotal_minor bigint, line_discount_minor bigint, line_tax_minor bigint,
    line_total_minor bigint
  );

  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at)
  values (auth.uid(), p_document_id, 'edited', null, private.now_iso());
end;
$$;

-- Payment status only moves among issued / partially_paid / paid. A draft or a voided invoice
-- keeps its status whatever its payments add up to (editing a payment on a voided invoice used to
-- un-void it).
create or replace function private.recalculate_document_payment(p_document_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_doc documents%rowtype;
  v_paid bigint;
  v_status text;
begin
  select * into v_doc from documents where id = p_document_id for update;
  if not found then
    raise exception 'Document not found';
  end if;

  select coalesce(sum(amount_minor), 0) into v_paid from settlements where document_id = p_document_id;

  v_status := v_doc.status;
  if v_doc.status in ('issued', 'partially_paid', 'paid') then
    if v_paid >= v_doc.total_minor and v_doc.total_minor > 0 then
      v_status := 'paid';
    elsif v_paid > 0 then
      v_status := 'partially_paid';
    else
      v_status := 'issued';
    end if;
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

-- The amount parameter widens to bigint, which Postgres treats as a new function, so the integer
-- versions are dropped rather than left as ambiguous overloads (PostgREST calls by name).
drop function public.create_settlement(uuid, text, integer, text, text, text, text);
drop function public.update_settlement(uuid, text, integer, text, text, text, text);

create function public.create_settlement(
  p_document_id uuid,
  p_method text,
  p_amount_minor bigint,
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
  v_doc documents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Payment amount must be more than zero';
  end if;

  select * into v_doc from documents where id = p_document_id for update;
  if not found then
    raise exception 'Document not found';
  end if;
  if v_doc.doc_type <> 'invoice' or v_doc.status not in ('issued', 'partially_paid') then
    raise exception 'Payments can only be logged on an issued invoice';
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

create function public.update_settlement(
  p_settlement_id uuid,
  p_method text,
  p_amount_minor bigint,
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
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Payment amount must be more than zero';
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

-- ---------------------------------------------------------------------------------------------
-- 4. Recurring generation isolates each schedule
-- ---------------------------------------------------------------------------------------------

-- Same as 003, except each schedule runs in its own subtransaction: if one fails (a number
-- collision, a missing profile), its work is rolled back, a warning is logged, and the run moves
-- on to the next schedule instead of rolling back every user's invoices.
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
  v_sched_count integer;
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
    begin
      select * into v_tpl from documents where id = v_sched.template_document_id;
      if not found or v_tpl.doc_type <> 'invoice' or v_tpl.status = 'void' then
        continue;
      end if;

      select default_payment_terms_days into v_terms from business_profile where id = v_sched.owner_id;

      v_iter := 0;
      v_sched_count := 0;
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
        v_sched_count := v_sched_count + 1;
        v_iter := v_iter + 1;
      end loop;

      update recurring_schedules
      set runs_count = v_sched.runs_count, next_run_date = v_sched.next_run_date, updated_at = private.now_iso()
      where id = v_sched.id;

      v_count := v_count + v_sched_count;
    exception when others then
      raise warning 'Recurring schedule % failed: %', v_sched.id, sqlerrm;
    end;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Numbers that are already taken are skipped
-- ---------------------------------------------------------------------------------------------

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
  v_number text;
begin
  select * into v_profile from business_profile where id = p_owner;
  if not found then
    raise exception 'Business profile not found';
  end if;

  v_year := case when v_profile.reset_numbering_yearly <> 0 then extract(year from now())::integer else 0 end;
  v_prefix := case when p_doc_type = 'estimate' then v_profile.estimate_prefix else v_profile.invoice_prefix end;

  for i in 1..1000 loop
    insert into doc_counters (owner_id, doc_type, year_bucket, next_number)
    values (p_owner, p_doc_type, v_year, 2)
    on conflict (owner_id, doc_type, year_bucket)
    do update set next_number = doc_counters.next_number + 1
    returning next_number - 1 into v_seq;

    v_seq_text := v_seq::text;
    if length(v_seq_text) < v_profile.number_padding then
      v_seq_text := lpad(v_seq_text, v_profile.number_padding, '0');
    end if;
    v_number := v_prefix || case when v_year > 0 then v_year::text || '-' else '' end || v_seq_text;

    if not exists (select 1 from documents where owner_id = p_owner and doc_number = v_number) then
      return v_number;
    end if;
  end loop;

  raise exception 'Couldn''t find a free document number. Change the numbering prefix in Settings.';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 6. Delete All Data clears the payment link too
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
    payment_link = null,
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
-- Privileges (as in 003: signed-in users only)
-- ---------------------------------------------------------------------------------------------

revoke all on function public.create_settlement(uuid, text, bigint, text, text, text, text) from public, anon;
revoke all on function public.update_settlement(uuid, text, bigint, text, text, text, text) from public, anon;
grant execute on function public.create_settlement(uuid, text, bigint, text, text, text, text) to authenticated;
grant execute on function public.update_settlement(uuid, text, bigint, text, text, text, text) to authenticated;
