-- Ensure the 'shop-assets' bucket is PUBLIC
update storage.buckets
set public = true
where id = 'shop-assets';

-- Ensure public read access for shop-assets
create policy "public can read shop asset files"
on storage.objects for select
using ( bucket_id = 'shop-assets' );
