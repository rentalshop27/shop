alter table public.shops
add column if not exists catalog_hero_image_path text;

insert into storage.buckets (id, name, public)
values ('shop-assets', 'shop-assets', false)
on conflict (id) do update set public = false;

create policy "owners can read shop asset files"
on storage.objects for select
using (
  bucket_id = 'shop-assets'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "owners can upload shop asset files"
on storage.objects for insert
with check (
  bucket_id = 'shop-assets'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "owners can update shop asset files"
on storage.objects for update
using (
  bucket_id = 'shop-assets'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
)
with check (bucket_id = 'shop-assets');

create policy "owners can delete shop asset files"
on storage.objects for delete
using (
  bucket_id = 'shop-assets'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);
