alter table public.customers
drop constraint if exists customers_shop_id_phone_normalized_key;

create unique index if not exists customers_active_phone_unique_idx
on public.customers (shop_id, phone_normalized)
where archived_at is null;
