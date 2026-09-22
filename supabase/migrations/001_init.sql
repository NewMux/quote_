-- Multi-tenant Postgres schema for Supabase, translated from the local SQLite schema
-- (src/db/migrations/001_init.ts + 002_client_photo.ts + 003_document_fk_cascade.ts).
--
-- Tenancy model: one Supabase Auth user = one business (Round 21 scope). Every table except
-- business_profile gets an owner_id column referencing auth.users(id); business_profile's own
-- primary key IS the owner's auth.uid() (it was a singleton row per-install before, now it's
-- one row per business). Row Level Security enforces isolation at the database layer — every
-- table only ever returns/accepts rows where owner_id (or id, for business_profile) matches the
-- calling user, so tenant isolation doesn't depend on the client behaving correctly.
--
-- Kept deliberately close to the SQLite shape rather than "properly Postgres-ified" everywhere
-- (timestamps stay as ISO 8601 text, booleans stay as integers) so Round 22's repository rewrite
-- is a mechanical swap of the query mechanism, not a data-shape rewrite too. Money stays as
-- integer minor units, matching src/lib/money.ts's existing convention.

create extension if not exists pgcrypto;

-- business_profile: one row per business, keyed directly by the owner's auth.uid().
create table business_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  logo_uri text,
  accent_color text not null default '#2563EB',
  email text, phone text, address text,
  tax_registration_number text,
  payment_instructions text,
  footer_terms text,
  default_currency_code text not null default 'USD',
  default_payment_terms_days integer not null default 14,
  estimate_prefix text not null default 'EST-',
  invoice_prefix text not null default 'INV-',
  number_padding integer not null default 3,
  reset_numbering_yearly integer not null default 0,
  created_at text not null, updated_at text not null
);
alter table business_profile enable row level security;
create policy "owner full access" on business_profile for all
  using (id = auth.uid()) with check (id = auth.uid());

create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  contact_name text, email text, phone text, address text,
  tax_registration_number text, notes text,
  photo_uri text,
  is_archived integer not null default 0,
  created_at text not null, updated_at text not null
);
create index idx_clients_owner_id on clients(owner_id);
create index idx_clients_display_name on clients(owner_id, display_name);
alter table clients enable row level security;
create policy "owner full access" on clients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table tax_brackets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  rate_bp integer not null,
  is_default integer not null default 0,
  is_archived integer not null default 0,
  created_at text not null, updated_at text not null
);
create index idx_tax_brackets_owner_id on tax_brackets(owner_id);
alter table tax_brackets enable row level security;
create policy "owner full access" on tax_brackets for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table item_catalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  default_unit_price_minor integer not null default 0,
  unit_label text not null default 'unit',
  is_taxable integer not null default 1,
  default_tax_bracket_id uuid references tax_brackets(id) on delete set null,
  is_archived integer not null default 0,
  created_at text not null, updated_at text not null
);
create index idx_item_catalog_owner_id on item_catalog(owner_id);
create index idx_item_catalog_name on item_catalog(owner_id, name);
alter table item_catalog enable row level security;
create policy "owner full access" on item_catalog for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table doc_counters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null check (doc_type in ('estimate','invoice')),
  year_bucket integer not null default 0,
  next_number integer not null default 1,
  primary key (owner_id, doc_type, year_bucket)
);
alter table doc_counters enable row level security;
create policy "owner full access" on doc_counters for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null check (doc_type in ('estimate','invoice')),
  doc_number text not null,
  status text not null default 'draft'
    check (status in ('draft','issued','partially_paid','paid','void')),
  viewed_at text,
  client_id uuid references clients(id) on delete set null,
  client_name_snapshot text,
  issue_date text, due_date text, expiry_date text,
  currency_code text not null,
  subtotal_minor integer not null default 0,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value integer,
  discount_amount_minor integer not null default 0,
  tax_total_minor integer not null default 0,
  total_minor integer not null default 0,
  amount_paid_minor integer not null default 0,
  notes text, terms_override text,
  converted_from_document_id uuid references documents(id) on delete set null,
  converted_to_document_id uuid references documents(id) on delete set null,
  voided_at text, void_reason text,
  pdf_uri text,
  created_at text not null, updated_at text not null
);
create unique index idx_documents_doc_number on documents(owner_id, doc_number);
create index idx_documents_owner_id on documents(owner_id);
create index idx_documents_status on documents(owner_id, status);
create index idx_documents_client_id on documents(client_id);
create index idx_documents_doc_type on documents(owner_id, doc_type);
alter table documents enable row level security;
create policy "owner full access" on documents for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table line_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  catalog_item_id uuid references item_catalog(id) on delete set null,
  position integer not null,
  description text not null,
  quantity real not null default 1,
  unit_label text,
  unit_price_minor integer not null default 0,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value integer,
  is_taxable integer not null default 1,
  tax_bracket_id uuid references tax_brackets(id) on delete set null,
  tax_bracket_name_snapshot text,
  tax_rate_bp integer not null default 0,
  line_subtotal_minor integer not null default 0,
  line_discount_minor integer not null default 0,
  line_tax_minor integer not null default 0,
  line_total_minor integer not null default 0,
  created_at text not null, updated_at text not null
);
create index idx_line_items_document_id on line_items(document_id);
alter table line_items enable row level security;
create policy "owner full access" on line_items for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table signatures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  signer_role text not null check (signer_role in ('merchant','client')),
  signer_name text,
  signature_image_uri text not null,
  signed_at text not null,
  created_at text not null
);
create unique index idx_signatures_doc_role on signatures(document_id, signer_role);
alter table signatures enable row level security;
create policy "owner full access" on signatures for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table settlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  method text not null check (method in ('cash','bank_transfer','check','other')),
  amount_minor integer not null,
  settled_date text not null,
  reference_number text,
  receipt_photo_uri text,
  notes text,
  created_at text not null
);
create index idx_settlements_document_id on settlements(document_id);
alter table settlements enable row level security;
create policy "owner full access" on settlements for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  event_type text not null check (event_type in (
    'created','edited','issued','viewed_marked','shared','emailed',
    'signed_merchant','signed_client','settlement_logged','status_changed',
    'converted_to_invoice','voided'
  )),
  event_detail text,
  created_at text not null
);
create index idx_activity_logs_document_id on activity_logs(document_id);
alter table activity_logs enable row level security;
create policy "owner full access" on activity_logs for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Seeds a fresh business_profile row + the default "No Tax" bracket for a newly signed-up user.
-- Mirrors 001_init.ts's install-time seed, but per-business instead of once globally.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.business_profile (id, business_name, accent_color, default_currency_code, created_at, updated_at)
  values (new.id, '', '#2563EB', 'USD', now()::text, now()::text);

  insert into public.tax_brackets (owner_id, name, rate_bp, is_default, created_at, updated_at)
  values (new.id, 'No Tax', 0, 1, now()::text, now()::text);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
