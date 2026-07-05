-- Migration to add fine_amount and fine_reason to rentals table

alter table public.rentals 
add column if not exists fine_amount numeric(10, 2) not null default 0.00,
add column if not exists fine_reason text not null default '',
add column if not exists fine_created_at timestamptz;
