-- Migration 0029: Backfill legacy deposit resolution rows before stricter checks.

update public.rentals
set
  deposit_forfeited_amount = deposit_amount,
  deposit_resolved_at = coalesce(deposit_resolved_at, updated_at, created_at)
where deposit_status = 'forfeited'
  and coalesce(deposit_forfeited_amount, 0) <= 0
  and deposit_amount > 0;

update public.rentals
set
  deposit_status = null,
  deposit_forfeited_amount = 0,
  deposit_resolution_note = coalesce(
    nullif(deposit_resolution_note, ''),
    'Normalized legacy forfeited status on zero-deposit rental during migration 0029'
  )
where deposit_status = 'forfeited'
  and deposit_amount <= 0;
