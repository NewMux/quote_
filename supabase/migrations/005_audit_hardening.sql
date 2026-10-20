-- Audit hardening, part 1 (October 2026). Part 2 (server-side rules) is 006.
--
-- 1. Money columns become bigint. integer capped amounts at 2,147,483,647 minor units — about
--    Rp 21.4M (US$1,300) in IDR, which uses two decimals — so larger invoices failed to save.
-- 2. Child rows (line items, signatures, payments, activity, recurring schedules) must belong to
--    the same owner as their document. RLS only checked owner_id, and foreign-key checks ignore
--    RLS, so a row owned by one user could point at another user's document.
--
-- Compatible with the 004 functions and with the app build already on the App Store.

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
