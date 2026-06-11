-- SQL migration to add the stock_items table and shop settings columns

-- Alter shops table to include brands, categories, and colors settings columns
alter table public.shops 
add column if not exists brands text[] not null default '{"Precious", "Chanel", "Dior", "Gucci"}',
add column if not exists categories text[] not null default '{"ชุดราตรี", "ชุดไทย", "ชุดสูท", "ชุดแต่งงาน"}',
add column if not exists colors text[] not null default '{"น้ำเงินมิดไนต์", "แดงไวน์", "ชมพูโรส", "ทองแชมเปญ", "ขาวมุก", "ดำคลาสสิก"}';

-- Create stock_items table
create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sku text not null,
  serial_number text not null default '',
  product_name text not null,
  brand text not null default '',
  category text not null default '',
  size text not null default 'M',
  primary_color text not null default '',
  public_description text not null default '',
  set_count integer not null default 1 check (set_count >= 1),
  rental_price_per_day numeric(10, 2) not null default 0.00,
  late_fee_rule text not null default '',
  deposit_amount numeric(10, 2) not null default 0.00,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, sku)
);

-- Indexes for performance
create index stock_items_shop_idx on public.stock_items (shop_id);
create index stock_items_sku_idx on public.stock_items (shop_id, sku);

-- Enable RLS
alter table public.stock_items enable row level security;

-- RLS Policy: Only shop owners can manage stock items
create policy "owners can manage stock_items"
on public.stock_items for all
using (public.is_shop_owner(shop_id))
with check (public.is_shop_owner(shop_id));

-- Audit Logging Trigger
create trigger audit_stock_items_trigger
after insert or update or delete
on public.stock_items
for each row execute function public.log_audit_event();

-- Storage Bucket for Stock Images
insert into storage.buckets (id, name, public)
values ('stock-images', 'stock-images', false)
on conflict (id) do update set public = false;

-- Storage RLS Policies
create policy "owners can read stock image files"
on storage.objects for select
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "owners can upload stock image files"
on storage.objects for insert
with check (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "owners can update stock image files"
on storage.objects for update
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
)
with check (bucket_id = 'stock-images');

create policy "owners can delete stock image files"
on storage.objects for delete
using (
  bucket_id = 'stock-images'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);
