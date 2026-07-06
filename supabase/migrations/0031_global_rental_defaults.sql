-- Add global rental defaults to shops table

ALTER TABLE public.shops
ADD COLUMN default_rental_prices JSONB NOT NULL DEFAULT '[{"days": 1, "price": 0}]'::jsonb,
ADD COLUMN default_deposit NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN default_late_fine_per_day NUMERIC NOT NULL DEFAULT 0;
