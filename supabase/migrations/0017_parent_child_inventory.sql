-- Migration: Parent-Child Inventory Structure
-- Creates products (parent) table, slims stock_items (child), migrates legacy data,
-- updates rentals to UUID FK, and creates atomic RPCs.

-- ══════════════════════════════════════════════════════════════════
-- Step 1: Create products (Parent) table
-- ══════════════════════════════════════════════════════════════════

create table public.products (
  id                   uuid    primary key default gen_random_uuid(),
  shop_id              uuid    not null references public.shops(id) on delete cascade,
  base_sku             text    not null,
  product_name         text    not null,
  brand                text    not null default '',
  category             text[]  not null default '{}',
  primary_color        text    not null default '',
  public_description   text    not null default '',
  rental_price_per_day numeric(10,2) not null default 0.00,
  late_fee_rule        text    not null default '',
  deposit_amount       numeric(10,2) not null default 0.00,
  image_urls           text[]  not null default '{}',
  public_visible       boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (shop_id, base_sku)
);

-- Indexes
create index products_shop_idx on public.products(shop_id);
create index products_public_catalog_idx on public.products(shop_id, public_visible);

-- RLS
alter table public.products enable row level security;

create policy "owners can manage products"
  on public.products for all
  using  (public.is_shop_owner(shop_id))
  with check (public.is_shop_owner(shop_id));

-- Audit trigger
create trigger audit_products_trigger
  after insert or update or delete on public.products
  for each row execute function public.log_audit_event();

create or replace function public.normalize_product_categories(p_value jsonb)
returns text[] language plpgsql immutable as $$
declare
  v_entry text;
  v_categories text[] := '{}'::text[];
begin
  if p_value is null then
    return v_categories;
  end if;

  if jsonb_typeof(p_value) = 'array' then
    for v_entry in
      select btrim(value)
      from jsonb_array_elements_text(p_value) as entries(value)
    loop
      if v_entry <> '' and not (v_entry = any(v_categories)) then
        v_categories := array_append(v_categories, v_entry);
      end if;
    end loop;

    return v_categories;
  end if;

  for v_entry in
    select btrim(value)
    from unnest(regexp_split_to_array(coalesce(p_value #>> '{}', ''), '\s*,\s*')) as entries(value)
  loop
    if v_entry <> '' and not (v_entry = any(v_categories)) then
      v_categories := array_append(v_categories, v_entry);
    end if;
  end loop;

  return v_categories;
end;
$$;

-- ══════════════════════════════════════════════════════════════════
-- Step 2: Add product_id FK + Unique Constraint to stock_items
-- ══════════════════════════════════════════════════════════════════

alter table public.stock_items
  add column product_id uuid references public.products(id) on delete cascade;

-- Index for efficient JOINs
create index idx_stock_items_product_id on public.stock_items(product_id);

-- Drop the old (shop_id, sku) index that was non-unique, replace with unique constraint
drop index if exists stock_items_sku_idx;

-- Ensure unique SKU per shop at database level
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.stock_items'::regclass
      and contype = 'u'
      and conname = 'stock_items_shop_id_sku_key'
  ) then
    alter table public.stock_items
      add constraint stock_items_shop_sku_unique unique (shop_id, sku);
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════
-- Step 3: Migrate legacy stock_items → create products (Parents)
-- ══════════════════════════════════════════════════════════════════

-- Group by (shop_id, product_name, brand, primary_color) to keep
-- same-name-different-color items as separate products
insert into public.products (
  shop_id, base_sku, product_name, brand, category, primary_color,
  public_description, rental_price_per_day, late_fee_rule,
  deposit_amount, image_urls, public_visible, created_at
)
select distinct on (shop_id, product_name, brand, primary_color)
  shop_id,
  sku                                       as base_sku,
  product_name,
  coalesce(brand, ''),
  public.normalize_product_categories(to_jsonb(category)),
  coalesce(primary_color, ''),
  coalesce(public_description, ''),
  coalesce(rental_price_per_day, 0),
  coalesce(late_fee_rule, ''),
  coalesce(deposit_amount, 0),
  coalesce(image_urls, '{}'),
  coalesce(public_visible, false),
  created_at
from public.stock_items
order by shop_id, product_name, brand, primary_color, created_at asc;

-- Link existing stock_items to their parent products
update public.stock_items si
set product_id = p.id
from public.products p
where si.shop_id       = p.shop_id
  and si.product_name  = p.product_name
  and coalesce(si.brand, '') = p.brand
  and coalesce(si.primary_color, '') = p.primary_color;

-- Enforce NOT NULL after all legacy data is linked
alter table public.stock_items
  alter column product_id set not null;

-- ══════════════════════════════════════════════════════════════════
-- Step 4: Slim child table — drop duplicate columns
-- ══════════════════════════════════════════════════════════════════
-- After this, stock_items has only: id, shop_id, product_id, sku, size, status,
-- created_at, updated_at

alter table public.stock_items
  drop column if exists product_name,
  drop column if exists brand,
  drop column if exists category,
  drop column if exists primary_color,
  drop column if exists public_description,
  drop column if exists rental_price_per_day,
  drop column if exists late_fee_rule,
  drop column if exists deposit_amount,
  drop column if exists image_urls,
  drop column if exists public_visible,
  drop column if exists serial_number,
  drop column if exists set_count;

-- ══════════════════════════════════════════════════════════════════
-- Step 5: Update rentals — migrate from SKU text to UUID FK
-- ══════════════════════════════════════════════════════════════════

alter table public.rentals
  add column stock_item_id uuid references public.stock_items(id) on delete restrict;

-- Map legacy data: find stock_item by (shop_id, sku)
update public.rentals r
set stock_item_id = (
  select si.id from public.stock_items si
  where si.sku     = r.stock_item_sku
    and si.shop_id = r.shop_id
  limit 1
)
where r.stock_item_id is null;

-- Enforce NOT NULL
alter table public.rentals
  alter column stock_item_id set not null;

-- Keep stock_item_sku as readonly legacy reference
alter table public.rentals
  alter column stock_item_sku drop not null;

-- Index
create index rentals_stock_item_id_idx on public.rentals(stock_item_id);

-- ══════════════════════════════════════════════════════════════════
-- Step 6: RPC #1 — create_product_with_variants (Atomic, Bulk)
-- ══════════════════════════════════════════════════════════════════

create or replace function public.create_product_with_variants(
  p_shop_id  uuid,
  p_product  jsonb,
  p_variants jsonb  -- [{size: "S", quantity: 2}, {size: "M", quantity: 2}]
) returns jsonb language plpgsql security definer as $$
declare
  v_product_id uuid;
  v_base_sku   text;
begin
  -- Security: verify ownership before anything
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  v_base_sku := p_product->>'base_sku';

  -- 1. Insert Product (Parent)
  insert into public.products (
    shop_id, base_sku, product_name, brand, category, primary_color,
    public_description, rental_price_per_day, late_fee_rule,
    deposit_amount, image_urls, public_visible
  ) values (
    p_shop_id,
    v_base_sku,
    p_product->>'product_name',
    coalesce(p_product->>'brand', ''),
    public.normalize_product_categories(p_product->'category'),
    coalesce(p_product->>'primary_color', ''),
    coalesce(p_product->>'public_description', ''),
    coalesce((p_product->>'rental_price_per_day')::numeric, 0),
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

  -- 2. Bulk Insert Children — SKU generated in DB
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

-- ══════════════════════════════════════════════════════════════════
-- Step 7: RPC #2 — add_stock_to_variant (with row-level lock)
-- ══════════════════════════════════════════════════════════════════

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
  -- Security check
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
  end if;

  -- Lock parent row to prevent race condition
  select * into v_product
  from public.products
  where id = p_product_id and shop_id = p_shop_id
  for update;

  if not found then
    raise exception 'ไม่พบสินค้าที่ระบุ';
  end if;

  -- Find current max sequence for this size (safe because row is locked)
  select coalesce(max(
    (regexp_match(sku, v_product.base_sku || '-' || p_size || '-(\d+)$'))[1]::int
  ), 0)
  into v_max_seq
  from public.stock_items
  where product_id = p_product_id and size = p_size;

  -- Bulk insert starting from max_seq+1
  insert into public.stock_items (shop_id, product_id, sku, size, status)
  select
    p_shop_id,
    p_product_id,
    v_product.base_sku || '-' || p_size || '-' || lpad((v_max_seq + gs)::text, 2, '0'),
    p_size,
    'available'
  from generate_series(1, p_quantity) as gs;

  return jsonb_build_object(
    'added',     p_quantity,
    'seq_start', v_max_seq + 1,
    'seq_end',   v_max_seq + p_quantity
  );
end;
$$;
