-- Round 23: private Storage bucket for signatures, receipts, PDFs, and the business logo/client
-- photos. Each business's files live under a top-level folder named after their own auth.uid(),
-- and RLS on storage.objects restricts access to files under a business's own folder, mirroring
-- the owner_id-based RLS already enforced on every Postgres table.

insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "Owners can manage their own files"
on storage.objects
for all
to authenticated
using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
