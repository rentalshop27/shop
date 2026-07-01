-- Ensure the 'costumes' bucket exists and is PUBLIC
insert into storage.buckets (id, name, public)
values ('costumes', 'costumes', true)
on conflict (id) do update set public = true;

-- Ensure public read access
create policy "public can read costumes files"
on storage.objects for select
using ( bucket_id = 'costumes' );

-- Ensure owners can upload to costumes
create policy "owners can upload costumes files"
on storage.objects for insert
with check (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

-- Ensure owners can update costumes files
create policy "owners can update costumes files"
on storage.objects for update
using (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

-- Ensure owners can delete costumes files
create policy "owners can delete costumes files"
on storage.objects for delete
using (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);
