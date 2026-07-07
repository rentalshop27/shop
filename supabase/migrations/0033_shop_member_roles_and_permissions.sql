alter table public.shop_members
  drop constraint if exists shop_members_role_check;

alter table public.shop_members
  add constraint shop_members_role_check
  check (role in ('owner', 'manager', 'staff'));

create or replace function public.get_shop_member_role(target_shop_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.shop_members
  where shop_id = target_shop_id
    and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_shop_role(target_shop_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and role = any (allowed_roles)
  );
$$;

create or replace function public.is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_shop_role(target_shop_id, array['owner']);
$$;

drop policy if exists "shop members can read accessible shops" on public.shops;
create policy "shop members can read accessible shops"
on public.shops for select
using (public.is_shop_member(id));

drop policy if exists "shop members can update accessible shops" on public.shops;
create policy "shop members can update accessible shops"
on public.shops for update
using (public.is_shop_owner(id))
with check (public.is_shop_owner(id));

drop policy if exists "owners can read shop members" on public.shop_members;
drop policy if exists "shop members can read shop members" on public.shop_members;
create policy "shop members can read shop members"
on public.shop_members for select
using (public.is_shop_member(shop_id));

drop policy if exists "owners can manage customers" on public.customers;
drop policy if exists "shop members can read customers" on public.customers;
create policy "shop members can read customers"
on public.customers for select
using (public.is_shop_member(shop_id));

drop policy if exists "shop members can insert customers" on public.customers;
create policy "shop members can insert customers"
on public.customers for insert
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can update customers" on public.customers;
create policy "shop members can update customers"
on public.customers for update
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "managers can delete customers" on public.customers;
create policy "managers can delete customers"
on public.customers for delete
using (public.has_shop_role(shop_id, array['owner', 'manager']));

drop policy if exists "owners can manage customer documents" on public.customer_documents;
drop policy if exists "shop members can read customer documents" on public.customer_documents;
create policy "shop members can read customer documents"
on public.customer_documents for select
using (public.is_shop_member(shop_id));

drop policy if exists "shop members can insert customer documents" on public.customer_documents;
create policy "shop members can insert customer documents"
on public.customer_documents for insert
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can update customer documents" on public.customer_documents;
create policy "shop members can update customer documents"
on public.customer_documents for update
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can delete customer documents" on public.customer_documents;
create policy "shop members can delete customer documents"
on public.customer_documents for delete
using (public.is_shop_member(shop_id));

drop policy if exists "owners can read customer document files" on storage.objects;
drop policy if exists "shop members can read customer document files" on storage.objects;
create policy "shop members can read customer document files"
on storage.objects for select
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_member(documents.shop_id)
  )
);

drop policy if exists "owners can upload customer document files" on storage.objects;
drop policy if exists "shop members can upload customer document files" on storage.objects;
create policy "shop members can upload customer document files"
on storage.objects for insert
with check (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
);

drop policy if exists "owners can update customer document files" on storage.objects;
drop policy if exists "shop members can update customer document files" on storage.objects;
create policy "shop members can update customer document files"
on storage.objects for update
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_member(documents.shop_id)
  )
)
with check (bucket_id = 'customer-documents');

drop policy if exists "owners can delete customer document files" on storage.objects;
drop policy if exists "shop members can delete customer document files" on storage.objects;
create policy "shop members can delete customer document files"
on storage.objects for delete
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_member(documents.shop_id)
  )
);

drop policy if exists "owners can manage rentals" on public.rentals;
drop policy if exists "shop members can read rentals" on public.rentals;
create policy "shop members can read rentals"
on public.rentals for select
using (public.is_shop_member(shop_id));

drop policy if exists "shop members can insert rentals" on public.rentals;
create policy "shop members can insert rentals"
on public.rentals for insert
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can update rentals" on public.rentals;
create policy "shop members can update rentals"
on public.rentals for update
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "managers can delete rentals" on public.rentals;
create policy "managers can delete rentals"
on public.rentals for delete
using (public.has_shop_role(shop_id, array['owner', 'manager']));

drop policy if exists "owners can read shop audit logs" on public.audit_logs;
drop policy if exists "managers can read shop audit logs" on public.audit_logs;
create policy "managers can read shop audit logs"
on public.audit_logs for select
using (public.has_shop_role(shop_id, array['owner', 'manager']));

drop policy if exists "owners can manage stock_items" on public.stock_items;
drop policy if exists "shop members can read stock_items" on public.stock_items;
create policy "shop members can read stock_items"
on public.stock_items for select
using (public.is_shop_member(shop_id));

drop policy if exists "shop members can insert stock_items" on public.stock_items;
create policy "shop members can insert stock_items"
on public.stock_items for insert
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can update stock_items" on public.stock_items;
create policy "shop members can update stock_items"
on public.stock_items for update
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "managers can delete stock_items" on public.stock_items;
create policy "managers can delete stock_items"
on public.stock_items for delete
using (public.has_shop_role(shop_id, array['owner', 'manager']));

drop policy if exists "owners can manage products" on public.products;
drop policy if exists "shop members can read products" on public.products;
create policy "shop members can read products"
on public.products for select
using (public.is_shop_member(shop_id));

drop policy if exists "shop members can insert products" on public.products;
create policy "shop members can insert products"
on public.products for insert
with check (public.is_shop_member(shop_id));

drop policy if exists "shop members can update products" on public.products;
create policy "shop members can update products"
on public.products for update
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "managers can delete products" on public.products;
create policy "managers can delete products"
on public.products for delete
using (public.has_shop_role(shop_id, array['owner', 'manager']));

drop policy if exists "owners can read stock image files" on storage.objects;
drop policy if exists "shop members can read stock image files" on storage.objects;
create policy "shop members can read stock image files"
on storage.objects for select
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
);

drop policy if exists "owners can upload stock image files" on storage.objects;
drop policy if exists "shop members can upload stock image files" on storage.objects;
create policy "shop members can upload stock image files"
on storage.objects for insert
with check (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
);

drop policy if exists "owners can update stock image files" on storage.objects;
drop policy if exists "shop members can update stock image files" on storage.objects;
create policy "shop members can update stock image files"
on storage.objects for update
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
)
with check (bucket_id = 'stock-images');

drop policy if exists "owners can delete stock image files" on storage.objects;
drop policy if exists "managers can delete stock image files" on storage.objects;
create policy "managers can delete stock image files"
on storage.objects for delete
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = any (array['owner', 'manager'])
  )
);

drop policy if exists "owners can upload costumes files" on storage.objects;
drop policy if exists "shop members can upload costumes files" on storage.objects;
create policy "shop members can upload costumes files"
on storage.objects for insert
with check (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
);

drop policy if exists "owners can update costumes files" on storage.objects;
drop policy if exists "shop members can update costumes files" on storage.objects;
create policy "shop members can update costumes files"
on storage.objects for update
using (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
  )
)
with check (bucket_id = 'costumes');

drop policy if exists "owners can delete costumes files" on storage.objects;
drop policy if exists "managers can delete costumes files" on storage.objects;
create policy "managers can delete costumes files"
on storage.objects for delete
using (
  bucket_id = 'costumes'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = any (array['owner', 'manager'])
  )
);

create or replace function public.enforce_customer_member_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if TG_OP = 'INSERT' then
    v_role := public.get_shop_member_role(new.shop_id);
  else
    v_role := public.get_shop_member_role(old.shop_id);
  end if;

  if v_role is null then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  if v_role = 'staff' then
    if TG_OP = 'INSERT' and new.profile_status not in ('incomplete', 'pending_review') then
      raise exception 'Unauthorized: พนักงานตั้งสถานะลูกค้าได้สูงสุดแค่รอตรวจ';
    end if;

    if TG_OP = 'UPDATE' then
      if new.archived_at is distinct from old.archived_at then
        raise exception 'Unauthorized: พนักงานไม่มีสิทธิ์ระงับหรือลูกค้าออกจากระบบ';
      end if;

      if new.profile_status is distinct from old.profile_status
         and new.profile_status not in ('incomplete', 'pending_review') then
        raise exception 'Unauthorized: พนักงานยืนยันสถานะลูกค้าไม่ได้';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists customers_member_permission_guard on public.customers;
create trigger customers_member_permission_guard
before insert or update on public.customers
for each row execute function public.enforce_customer_member_permissions();

create or replace function public.enforce_rental_member_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := public.get_shop_member_role(new.shop_id);

  if v_role is null then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  if v_role = 'staff' then
    if new.status is distinct from old.status then
      if not (
        (old.status = 'booked' and new.status = 'active')
        or (old.status in ('active', 'overdue') and new.status = 'returned')
      ) then
        raise exception 'Unauthorized: พนักงานแก้ไขหรือยกเลิกใบเช่าย้อนหลังไม่ได้';
      end if;
    end if;

    if new.stock_item_id is distinct from old.stock_item_id
       or coalesce(new.stock_item_sku, '') is distinct from coalesce(old.stock_item_sku, '')
       or new.pickup_date is distinct from old.pickup_date
       or new.return_date is distinct from old.return_date
       or new.rental_price is distinct from old.rental_price
       or new.deposit_amount is distinct from old.deposit_amount
       or new.collected_amount is distinct from old.collected_amount
       or coalesce(new.shipping_cost, 0) is distinct from coalesce(old.shipping_cost, 0)
       or coalesce(new.notes, '') is distinct from coalesce(old.notes, '')
       or coalesce(new.fine_amount, 0) is distinct from coalesce(old.fine_amount, 0)
       or coalesce(new.fine_reason, '') is distinct from coalesce(old.fine_reason, '')
       or new.fine_created_at is distinct from old.fine_created_at
       or new.deposit_status is distinct from old.deposit_status
       or coalesce(new.deposit_forfeited_amount, 0) is distinct from coalesce(old.deposit_forfeited_amount, 0)
       or coalesce(new.deposit_resolution_note, '') is distinct from coalesce(old.deposit_resolution_note, '')
       or new.deposit_resolved_at is distinct from old.deposit_resolved_at then
      raise exception 'Unauthorized: พนักงานมีสิทธิ์เฉพาะอัปเดตสถานะรับชุดหรือคืนชุดเท่านั้น';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists rentals_member_permission_guard on public.rentals;
create trigger rentals_member_permission_guard
before update on public.rentals
for each row execute function public.enforce_rental_member_permissions();

create or replace function public.create_product_with_variants(
  p_shop_id  uuid,
  p_product  jsonb,
  p_variants jsonb
) returns jsonb language plpgsql security definer as $$
declare
  v_product_id uuid;
  v_base_sku   text;
begin
  if not public.is_shop_member(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  v_base_sku := p_product->>'base_sku';

  insert into public.products (
    shop_id, base_sku, product_name, brand, category, primary_color,
    public_description, rental_tiers, late_fee_rule,
    deposit_amount, image_urls, public_visible
  ) values (
    p_shop_id,
    v_base_sku,
    p_product->>'product_name',
    coalesce(p_product->>'brand', ''),
    public.normalize_product_categories(p_product->'category'),
    coalesce(p_product->>'primary_color', ''),
    coalesce(p_product->>'public_description', ''),
    coalesce(p_product->'rental_tiers', '[]'::jsonb),
    coalesce(p_product->>'late_fee_rule', ''),
    coalesce((p_product->>'deposit_amount')::numeric, 0),
    case
      when p_product->'image_urls' is not null
        and jsonb_typeof(p_product->'image_urls') = 'array'
      then array(select jsonb_array_elements_text(p_product->'image_urls'))
      else '{}'::text[]
    end,
    coalesce((p_product->>'public_visible')::boolean, false)
  )
  returning id into v_product_id;

  insert into public.stock_items (shop_id, product_id, sku, size, status)
  select
    p_shop_id,
    v_product_id,
    v_base_sku || '-' || (v.value->>'size') || '-' || lpad(gs::text, 2, '0'),
    v.value->>'size',
    'available'
  from jsonb_array_elements(p_variants) as v(value),
       lateral generate_series(1, (v.value->>'quantity')::int) as gs;

  return jsonb_build_object('product_id', v_product_id);
end;
$$;

create or replace function public.add_stock_to_variant(
  p_shop_id    uuid,
  p_product_id uuid,
  p_size       text,
  p_quantity   int
) returns jsonb language plpgsql security definer as $$
declare
  v_product  record;
  v_max_seq  int := 0;
begin
  if not public.is_shop_member(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and shop_id = p_shop_id
  for update;

  if not found then
    raise exception 'ไม่พบสินค้าที่ระบุ';
  end if;

  select coalesce(max(
    (regexp_match(sku, v_product.base_sku || '-' || p_size || '-(\d+)$'))[1]::int
  ), 0)
  into v_max_seq
  from public.stock_items
  where product_id = p_product_id and size = p_size;

  insert into public.stock_items (shop_id, product_id, sku, size, status)
  select
    p_shop_id,
    p_product_id,
    v_product.base_sku || '-' || p_size || '-' || lpad((v_max_seq + gs)::text, 2, '0'),
    p_size,
    'available'
  from generate_series(1, p_quantity) as gs;

  return jsonb_build_object(
    'added', p_quantity,
    'next_sequence_start', v_max_seq + 1
  );
end;
$$;

create or replace function public.bulk_update_display_order(
  p_shop_id uuid,
  p_updates jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_update jsonb;
begin
  if not public.has_shop_role(p_shop_id, array['owner', 'manager']) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการลำดับหน้าร้าน';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) as pending_update
    where not exists (
      select 1
      from public.products
      where id = (pending_update->>'id')::uuid
        and shop_id = p_shop_id
    )
  ) then
    raise exception 'Unauthorized: one or more products do not belong to this shop';
  end if;

  for v_update in select * from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) loop
    update public.products
       set display_order = (v_update->>'display_order')::int,
           updated_at = now()
     where id = (v_update->>'id')::uuid
       and shop_id = p_shop_id;
  end loop;
end;
$$;

create or replace function public.resolve_rental_deposit(
  p_shop_id uuid,
  p_updates jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_expected_count int;
  v_updated_count int;
begin
  if not public.has_shop_role(p_shop_id, array['owner', 'manager']) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการยอดเงินมัดจำ';
  end if;

  if jsonb_typeof(p_updates) <> 'array' then
    raise exception 'Deposit updates must be a JSON array';
  end if;

  v_expected_count := jsonb_array_length(p_updates);
  if v_expected_count = 0 then
    raise exception 'Deposit updates array cannot be empty';
  end if;

  with parsed as (
    select
      id,
      deposit_status,
      deposit_forfeited_amount,
      nullif(deposit_resolution_note, '') as deposit_resolution_note,
      deposit_resolved_at
    from jsonb_to_recordset(p_updates) as payload(
      id uuid,
      deposit_status text,
      deposit_forfeited_amount numeric(10, 2),
      deposit_resolution_note text,
      deposit_resolved_at timestamptz
    )
  ),
  locked_rows as (
    select r.id
    from public.rentals r
    join parsed p on p.id = r.id
    where r.shop_id = p_shop_id
    for update
  )
  update public.rentals r
  set
    deposit_status = p.deposit_status,
    deposit_forfeited_amount = p.deposit_forfeited_amount,
    deposit_resolution_note = p.deposit_resolution_note,
    deposit_resolved_at = p.deposit_resolved_at,
    updated_at = now()
  from parsed p
  where r.shop_id = p_shop_id
    and r.id = p.id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'ไม่พบรายการเช่าชุดครบทุกแถวสำหรับการปิดเคสเงินมัดจำ';
  end if;

  return jsonb_build_object('updated_count', v_updated_count);
end;
$$;

create or replace function public.save_rental_fine_updates(
  p_shop_id uuid,
  p_updates jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_expected_count int;
  v_updated_count int;
begin
  if not public.has_shop_role(p_shop_id, array['owner', 'manager']) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการค่าปรับ';
  end if;

  if jsonb_typeof(p_updates) <> 'array' then
    raise exception 'Fine updates must be a JSON array';
  end if;

  v_expected_count := jsonb_array_length(p_updates);
  if v_expected_count = 0 then
    raise exception 'Fine updates array cannot be empty';
  end if;

  with parsed as (
    select
      id,
      fine_amount,
      coalesce(fine_reason, '') as fine_reason,
      fine_created_at
    from jsonb_to_recordset(p_updates) as payload(
      id uuid,
      fine_amount numeric(10, 2),
      fine_reason text,
      fine_created_at timestamptz
    )
  ),
  locked_rows as (
    select r.id
    from public.rentals r
    join parsed p on p.id = r.id
    where r.shop_id = p_shop_id
    for update
  )
  update public.rentals r
  set
    fine_amount = p.fine_amount,
    fine_reason = p.fine_reason,
    fine_created_at = p.fine_created_at,
    updated_at = now()
  from parsed p
  where r.shop_id = p_shop_id
    and r.id = p.id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'ไม่พบรายการเช่าชุดครบทุกแถวสำหรับการบันทึกค่าปรับ';
  end if;

  return jsonb_build_object('updated_count', v_updated_count);
end;
$$;
