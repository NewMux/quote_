-- Fills an App Review demo account with a finished business profile and sample documents.
--
-- 1. Create the user first: Supabase dashboard → Authentication → Users → Add user →
--    Create new user, with "Auto Confirm User" ticked. The on_auth_user_created trigger gives
--    it an empty business profile and a "No Tax" rate.
-- 2. Set v_email below to that user's email, then run this whole file in the SQL editor.
--
-- The SQL editor runs as the postgres role, so row-level security doesn't apply here. The
-- script refuses to run twice on the same account. Dates are relative to today, so the overdue
-- invoice is always overdue on the day you run it. The account stays unsubscribed, so the
-- reviewer lands on the paywall right after signing in.

do $$
declare
  v_email text := 'appreview@newmux.com';  -- change to the demo account's email
  v_uid uuid;
  v_now text := to_char(clock_timestamp() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_tax uuid;
  c_cafe uuid; c_rivera uuid; c_oakline uuid;
  i_labor uuid; i_room uuid; i_materials uuid;
  d_paid uuid; d_partial uuid; d_overdue uuid; d_draft uuid; d_estimate uuid;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception 'No user with email %. Create it under Authentication → Users first.', v_email;
  end if;
  if exists (select 1 from documents where owner_id = v_uid) then
    raise exception 'This account already has documents; the demo data was probably seeded already.';
  end if;

  -- Business profile: a filled-in business name also skips onboarding.
  update business_profile set
    business_name = 'Harbor Home Services',
    email = v_email,
    phone = '(555) 010-2030',
    address = E'120 Harbor Street\nPortland, ME 04101',
    payment_instructions = 'Bank transfer or check payable to Harbor Home Services.',
    footer_terms = 'Payment due within 14 days. Thank you for your business!',
    accent_color = '#6D5DF6',
    default_currency_code = 'USD',
    default_payment_terms_days = 14,
    updated_at = v_now
  where id = v_uid;

  -- Tax: an 8% sales tax becomes the default in place of "No Tax".
  update tax_brackets set is_default = 0, updated_at = v_now where owner_id = v_uid;
  insert into tax_brackets (owner_id, name, rate_bp, is_default, created_at, updated_at)
  values (v_uid, 'Sales Tax', 800, 1, v_now, v_now) returning id into v_tax;

  -- Clients
  insert into clients (owner_id, display_name, contact_name, email, phone, address, created_at, updated_at)
  values (v_uid, 'Brightside Café', 'Maya Chen', 'maya@example.com', '(555) 010-1111', E'45 Commercial St\nPortland, ME 04101', v_now, v_now)
  returning id into c_cafe;
  insert into clients (owner_id, display_name, contact_name, email, phone, address, created_at, updated_at)
  values (v_uid, 'Rivera Family', 'Daniel Rivera', 'daniel@example.com', '(555) 010-2222', E'9 Elm Avenue\nSouth Portland, ME 04106', v_now, v_now)
  returning id into c_rivera;
  insert into clients (owner_id, display_name, contact_name, email, phone, address, created_at, updated_at)
  values (v_uid, 'Oakline Property Management', 'Priya Nair', 'priya@example.com', '(555) 010-3333', E'300 Fore Street, Suite 4\nPortland, ME 04101', v_now, v_now)
  returning id into c_oakline;

  -- Item catalog
  insert into item_catalog (owner_id, name, description, default_unit_price_minor, unit_label, is_taxable, default_tax_bracket_id, created_at, updated_at)
  values (v_uid, 'Labor', 'Skilled labor, per hour', 8500, 'hr', 1, v_tax, v_now, v_now) returning id into i_labor;
  insert into item_catalog (owner_id, name, description, default_unit_price_minor, unit_label, is_taxable, default_tax_bracket_id, created_at, updated_at)
  values (v_uid, 'Interior Painting', 'Walls and trim, two coats', 35000, 'room', 1, v_tax, v_now, v_now) returning id into i_room;
  insert into item_catalog (owner_id, name, description, default_unit_price_minor, unit_label, is_taxable, default_tax_bracket_id, created_at, updated_at)
  values (v_uid, 'Materials', 'Paint, primer and supplies', 12000, 'unit', 1, v_tax, v_now, v_now) returning id into i_materials;

  -- INV-001: paid. 6 hr labor + materials = $630.00 + $50.40 tax = $680.40
  insert into documents (owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, issue_date, due_date,
    currency_code, subtotal_minor, tax_total_minor, total_minor, amount_paid_minor, created_at, updated_at)
  values (v_uid, 'invoice', 'INV-001', 'paid', c_cafe, 'Brightside Café',
    to_char(current_date - 30, 'YYYY-MM-DD'), to_char(current_date - 16, 'YYYY-MM-DD'),
    'USD', 63000, 5040, 68040, 68040, v_now, v_now)
  returning id into d_paid;
  insert into line_items (owner_id, document_id, catalog_item_id, position, description, quantity, unit_label, unit_price_minor,
    is_taxable, tax_bracket_id, tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_tax_minor, line_total_minor, created_at, updated_at)
  values
    (v_uid, d_paid, i_labor, 0, 'Labor', 6, 'hr', 8500, 1, v_tax, 'Sales Tax', 800, 51000, 4080, 55080, v_now, v_now),
    (v_uid, d_paid, i_materials, 1, 'Materials', 1, 'unit', 12000, 1, v_tax, 'Sales Tax', 800, 12000, 960, 12960, v_now, v_now);
  insert into settlements (owner_id, document_id, method, amount_minor, settled_date, reference_number, created_at)
  values (v_uid, d_paid, 'bank_transfer', 68040, to_char(current_date - 18, 'YYYY-MM-DD'), 'TRF-20931', v_now);

  -- INV-002: partially paid. 3 rooms = $1,050.00 + $84.00 tax = $1,134.00, $500.00 received
  insert into documents (owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, issue_date, due_date,
    currency_code, subtotal_minor, tax_total_minor, total_minor, amount_paid_minor, created_at, updated_at)
  values (v_uid, 'invoice', 'INV-002', 'partially_paid', c_oakline, 'Oakline Property Management',
    to_char(current_date - 10, 'YYYY-MM-DD'), to_char(current_date + 4, 'YYYY-MM-DD'),
    'USD', 105000, 8400, 113400, 50000, v_now, v_now)
  returning id into d_partial;
  insert into line_items (owner_id, document_id, catalog_item_id, position, description, quantity, unit_label, unit_price_minor,
    is_taxable, tax_bracket_id, tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_tax_minor, line_total_minor, created_at, updated_at)
  values (v_uid, d_partial, i_room, 0, 'Interior Painting', 3, 'room', 35000, 1, v_tax, 'Sales Tax', 800, 105000, 8400, 113400, v_now, v_now);
  insert into settlements (owner_id, document_id, method, amount_minor, settled_date, reference_number, created_at)
  values (v_uid, d_partial, 'check', 50000, to_char(current_date - 3, 'YYYY-MM-DD'), 'Check #1042', v_now);

  -- INV-003: issued and past due, so it shows as Overdue. 4 hr labor = $340.00 + $27.20 tax = $367.20
  insert into documents (owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, issue_date, due_date,
    currency_code, subtotal_minor, tax_total_minor, total_minor, created_at, updated_at)
  values (v_uid, 'invoice', 'INV-003', 'issued', c_rivera, 'Rivera Family',
    to_char(current_date - 25, 'YYYY-MM-DD'), to_char(current_date - 11, 'YYYY-MM-DD'),
    'USD', 34000, 2720, 36720, v_now, v_now)
  returning id into d_overdue;
  insert into line_items (owner_id, document_id, catalog_item_id, position, description, quantity, unit_label, unit_price_minor,
    is_taxable, tax_bracket_id, tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_tax_minor, line_total_minor, created_at, updated_at)
  values (v_uid, d_overdue, i_labor, 0, 'Labor', 4, 'hr', 8500, 1, v_tax, 'Sales Tax', 800, 34000, 2720, 36720, v_now, v_now);

  -- INV-004: draft. 2 hr labor = $170.00 + $13.60 tax = $183.60
  insert into documents (owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, issue_date, due_date,
    currency_code, subtotal_minor, tax_total_minor, total_minor, created_at, updated_at)
  values (v_uid, 'invoice', 'INV-004', 'draft', c_cafe, 'Brightside Café',
    to_char(current_date, 'YYYY-MM-DD'), to_char(current_date + 14, 'YYYY-MM-DD'),
    'USD', 17000, 1360, 18360, v_now, v_now)
  returning id into d_draft;
  insert into line_items (owner_id, document_id, catalog_item_id, position, description, quantity, unit_label, unit_price_minor,
    is_taxable, tax_bracket_id, tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_tax_minor, line_total_minor, created_at, updated_at)
  values (v_uid, d_draft, i_labor, 0, 'Labor', 2, 'hr', 8500, 1, v_tax, 'Sales Tax', 800, 17000, 1360, 18360, v_now, v_now);

  -- EST-001: issued estimate, ready to convert. 2 rooms = $700.00 + $56.00 tax = $756.00
  insert into documents (owner_id, doc_type, doc_number, status, client_id, client_name_snapshot, issue_date, expiry_date,
    currency_code, subtotal_minor, tax_total_minor, total_minor, notes, created_at, updated_at)
  values (v_uid, 'estimate', 'EST-001', 'issued', c_rivera, 'Rivera Family',
    to_char(current_date - 2, 'YYYY-MM-DD'), to_char(current_date + 28, 'YYYY-MM-DD'),
    'USD', 70000, 5600, 75600, 'Living room and hallway. Colors to be confirmed on site.', v_now, v_now)
  returning id into d_estimate;
  insert into line_items (owner_id, document_id, catalog_item_id, position, description, quantity, unit_label, unit_price_minor,
    is_taxable, tax_bracket_id, tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_tax_minor, line_total_minor, created_at, updated_at)
  values (v_uid, d_estimate, i_room, 0, 'Interior Painting', 2, 'room', 35000, 1, v_tax, 'Sales Tax', 800, 70000, 5600, 75600, v_now, v_now);

  -- Activity timeline for each document
  insert into activity_logs (owner_id, document_id, event_type, event_detail, created_at) values
    (v_uid, d_paid, 'created', null, v_now), (v_uid, d_paid, 'issued', null, v_now),
    (v_uid, d_paid, 'settlement_logged', null, v_now), (v_uid, d_paid, 'status_changed', 'paid', v_now),
    (v_uid, d_partial, 'created', null, v_now), (v_uid, d_partial, 'issued', null, v_now),
    (v_uid, d_partial, 'settlement_logged', null, v_now), (v_uid, d_partial, 'status_changed', 'partially_paid', v_now),
    (v_uid, d_overdue, 'created', null, v_now), (v_uid, d_overdue, 'issued', null, v_now),
    (v_uid, d_draft, 'created', null, v_now),
    (v_uid, d_estimate, 'created', null, v_now), (v_uid, d_estimate, 'issued', null, v_now);

  -- Numbering continues after the seeded documents: the next invoice is INV-005, the next
  -- estimate EST-002.
  insert into doc_counters (owner_id, doc_type, year_bucket, next_number) values
    (v_uid, 'invoice', 0, 5), (v_uid, 'estimate', 0, 2)
  on conflict (owner_id, doc_type, year_bucket) do update set next_number = excluded.next_number;

  raise notice 'Seeded the demo account % (%).', v_email, v_uid;
end;
$$;
