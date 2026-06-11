-- SQL migration to add the rentals table

create type public.rental_status as enum (
  'booked',
  'active',
  'returned',
  'overdue'
);

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_code text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stock_item_sku text not null,
  pickup_date date not null,
  return_date date not null,
  rental_price numeric(10, 2) not null default 0.00,
  deposit_amount numeric(10, 2) not null default 0.00,
  collected_amount numeric(10, 2) not null default 0.00,
  status public.rental_status not null default 'booked',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, order_code)
);

create index rentals_shop_status_idx on public.rentals (shop_id, status);
create index rentals_customer_idx on public.rentals (customer_id);

alter table public.rentals enable row level security;

create policy "owners can manage rentals"
on public.rentals for all
using (public.is_shop_owner(shop_id))
with check (public.is_shop_owner(shop_id));
