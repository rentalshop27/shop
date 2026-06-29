-- Public customer catalog controls.

alter table public.shops
add column if not exists public_catalog_enabled boolean not null default true;

alter table public.stock_items
add column if not exists public_visible boolean not null default true;

create index if not exists stock_items_public_catalog_idx
on public.stock_items (shop_id, public_visible, status, created_at desc);
