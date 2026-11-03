update storage.buckets
set allowed_mime_types = array['video/webm', 'video/mp4', 'image/jpeg', 'image/png', 'image/webp']
where id in ('drafts', 'published');
