-- Align existing shops with the shipped global rental default contract.
-- Keep explicit custom values intact by only updating rows that still match the
-- original untouched fallback trio from 0031.

alter table public.shops
  alter column default_rental_prices set default '[{"days": 1, "price": 100}]'::jsonb,
  alter column default_late_fine_per_day set default 200;

update public.shops
set
  default_rental_prices = '[{"days": 1, "price": 100}]'::jsonb,
  default_late_fine_per_day = 200
where default_deposit = 0
  and default_late_fine_per_day = 0
  and default_rental_prices = '[{"days": 1, "price": 0}]'::jsonb;
