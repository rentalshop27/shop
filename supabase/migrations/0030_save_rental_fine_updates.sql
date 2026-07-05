-- Migration 0030: Save grouped rental fine allocations atomically.

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
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
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
