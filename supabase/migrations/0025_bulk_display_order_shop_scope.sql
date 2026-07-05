drop function if exists public.bulk_update_display_order(jsonb);

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
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
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
