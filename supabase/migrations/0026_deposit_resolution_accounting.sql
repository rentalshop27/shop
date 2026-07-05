-- Migration 0026: Deposit resolution accounting
-- Tracks refunded/forfeited deposit outcomes as durable accounting data.

alter table public.rentals
  add column if not exists deposit_forfeited_amount numeric(10, 2) not null default 0.00,
  add column if not exists deposit_resolution_note text,
  add column if not exists deposit_resolved_at timestamptz;

alter table public.rentals
  drop constraint if exists rentals_deposit_forfeited_amount_bounds,
  add constraint rentals_deposit_forfeited_amount_bounds
    check (
      deposit_forfeited_amount >= 0
      and deposit_forfeited_amount <= deposit_amount
    );

alter table public.rentals
  drop constraint if exists rentals_returned_deposit_not_forfeited,
  add constraint rentals_returned_deposit_not_forfeited
    check (
      deposit_status is distinct from 'returned'
      or deposit_forfeited_amount = 0
    );
