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

alter table public.products
  alter column category drop default,
  alter column category type text[]
    using public.normalize_product_categories(to_jsonb(category)),
  alter column category set default '{}'::text[];

update public.products
set category = public.normalize_product_categories(to_jsonb(category))
where category is null
   or exists (
     select 1
     from unnest(category) as entries(value)
     where btrim(value) = ''
  );

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
