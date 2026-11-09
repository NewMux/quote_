-- Caps what a person can upload to their private folder: 10 MB a file, and only the types the app
-- itself writes (JPEG photos and logos, PNG signatures, PDF documents). Without a cap, one account
-- could fill the project's storage quota. Applied to noble-kite as "storage_upload_limits".

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'user-files';
