-- Prevent renting the same stock item again while it still has an open rental.
create unique index rentals_one_open_rental_per_stock_item_idx
on public.rentals (shop_id, stock_item_sku)
where status in ('booked', 'active', 'overdue');
