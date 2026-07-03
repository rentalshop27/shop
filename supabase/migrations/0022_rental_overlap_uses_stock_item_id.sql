-- Keep overlap enforcement aligned with the post-0017 rental contract.
-- Rentals now require stock_item_id, while stock_item_sku remains legacy metadata.
create or replace function public.check_rental_date_overlap()
returns trigger as $$
begin
  if new.status in ('booked', 'active', 'overdue') then
    if exists (
      select 1 from public.rentals
      where id <> new.id
        and shop_id = new.shop_id
        and stock_item_id = new.stock_item_id
        and status in ('booked', 'active', 'overdue')
        and pickup_date <= new.return_date
        and return_date >= new.pickup_date
    ) then
      raise exception
        'Stock item % already has an overlapping open rental in the requested date range.',
        coalesce(new.stock_item_sku, new.stock_item_id::text);
    end if;
  end if;

  return new;
end;
$$ language plpgsql;
