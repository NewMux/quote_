-- Round 32: payment links on invoices.
--
-- business_profile.payment_link is the business's default pay URL (Stripe Payment Link, PayPal.me,
-- a bank's pay link…). It may contain {amount}, {currency} and {number} placeholders, which the
-- app fills per invoice. documents.payment_link optionally overrides it for one invoice. The PDF
-- prints the resolved link as a QR code and a "Pay online" button.

alter table public.business_profile add column if not exists payment_link text;
alter table public.documents add column if not exists payment_link text;

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
    -- Only touch the override when the client sends it, so older app versions that don't know
    -- about payment links can't wipe one out on save.
    payment_link = case
      when p_header ? 'payment_link' then nullif(btrim(p_header->>'payment_link'), '')
      else payment_link
    end,
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
    currency_code, notes, terms_override, payment_link, discount_type, discount_value,
    subtotal_minor, discount_amount_minor, tax_total_minor, total_minor, created_at, updated_at
  )
  values (
    v_id, v_src.owner_id, p_doc_type, p_doc_number, 'draft', v_src.client_id,
    v_src.client_name_snapshot, p_due_date, v_src.currency_code, v_src.notes,
    v_src.terms_override, v_src.payment_link, v_src.discount_type, v_src.discount_value, v_src.subtotal_minor,
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

revoke all on function public.save_document_edit(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_document_edit(uuid, jsonb, jsonb) to authenticated;
revoke all on function private.copy_document_into(uuid, text, text, text) from public, anon;
grant execute on function private.copy_document_into(uuid, text, text, text) to authenticated;
