-- Migration: Rental Tiers (Package Pricing)
-- Replaces scalar rental_price_per_day with a flexible jsonb array rental_tiers
-- e.g. [{"days": 1, "price": 1000}, {"days": 3, "price": 1500}]

-- ══════════════════════════════════════════════════════════════════
-- Step 1: Add rental_tiers column to products (parent)
-- ══════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists rental_tiers jsonb not null default '[]'::jsonb;

-- Constraint: must always be a JSON array (prevents corrupted data)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'check_rental_tiers_is_array'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint check_rental_tiers_is_array
      check (jsonb_typeof(rental_tiers) = 'array');
  end if;
end;
$$;

-- ══════════════════════════════════════════════════════════════════
-- Step 2: Migrate legacy data — convert scalar price → 1-day tier
-- ══════════════════════════════════════════════════════════════════

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'rental_price_per_day'
  ) then
    execute $sql$
      update public.products
      set rental_tiers = jsonb_build_array(
        jsonb_build_object('days', 1, 'price', rental_price_per_day)
      )
      where rental_price_per_day > 0
        and jsonb_array_length(rental_tiers) = 0
    $sql$;
  end if;
end;
$$;

update public.products
set rental_tiers = jsonb_build_array(
  jsonb_build_object('days', 1, 'price', 0)
)
where jsonb_array_length(rental_tiers) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'check_rental_tiers_not_empty'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint check_rental_tiers_not_empty
      check (jsonb_array_length(rental_tiers) > 0);
  end if;
end;
$$;

create or replace function public.is_valid_rental_tiers(p_tiers jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_tier jsonb;
  v_days numeric;
  v_price numeric;
  v_seen_days integer[] := '{}';
begin
  if jsonb_typeof(p_tiers) <> 'array' or jsonb_array_length(p_tiers) = 0 then
    return false;
  end if;

  for v_tier in select value from jsonb_array_elements(p_tiers)
  loop
    if jsonb_typeof(v_tier) <> 'object'
      or jsonb_typeof(v_tier->'days') <> 'number'
      or jsonb_typeof(v_tier->'price') <> 'number'
    then
      return false;
    end if;

    v_days := (v_tier->>'days')::numeric;
    v_price := (v_tier->>'price')::numeric;

    if v_days <= 0 or v_days <> trunc(v_days) or v_price < 0 then
      return false;
    end if;

    if v_days::integer = any(v_seen_days) then
      return false;
    end if;

    v_seen_days := array_append(v_seen_days, v_days::integer);
  end loop;

  return true;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'check_rental_tiers_items_have_valid_shape'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint check_rental_tiers_items_have_valid_shape
      check (public.is_valid_rental_tiers(rental_tiers));
  end if;
end;
$$;

-- ══════════════════════════════════════════════════════════════════
-- Step 3: Drop the old scalar column (data is now in rental_tiers)
-- ══════════════════════════════════════════════════════════════════

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'rental_price_per_day'
  ) then
    alter table public.products
      drop column if exists rental_price_per_day;
  end if;
end;
$$;

-- ══════════════════════════════════════════════════════════════════
-- Step 4: Update RPC create_product_with_variants
-- ⚠️  rental_tiers goes into products (parent) ONLY
-- ⚠️  INSERT into stock_items has NO price columns — they were
--     already dropped in migration 0017_parent_child_inventory.sql
-- ══════════════════════════════════════════════════════════════════

create or replace function public.create_product_with_variants(
  p_shop_id  uuid,
  p_product  jsonb,
  p_variants jsonb  -- [{size: "S", quantity: 2}, ...]
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

  -- 1. Insert Product (Parent) — rental_tiers replaces rental_price_per_day
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

  -- 2. Bulk Insert Children — SKU generated in DB
  -- ⚠️ stock_items only has: shop_id, product_id, sku, size, status
  --    (all price columns were dropped in 0017_parent_child_inventory.sql)
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
