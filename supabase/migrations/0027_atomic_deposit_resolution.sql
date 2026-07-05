-- Migration 0027: Atomic deposit resolution updates
-- Ensures grouped rental deposit resolution commits in one transaction.

alter table public.rentals
  drop constraint if exists rentals_forfeited_deposit_positive,
  add constraint rentals_forfeited_deposit_positive
    check (
      deposit_status is distinct from 'forfeited'
      or deposit_forfeited_amount > 0
    );

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
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: คุณไม่มีสิทธิ์จัดการร้านนี้';
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
