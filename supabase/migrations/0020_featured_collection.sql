-- Add featured + display order columns to products
alter table public.products
  add column is_featured   boolean not null default false,
  add column display_order int     not null default 0;

-- Composite index for catalog query sort
create index products_featured_order_idx
  on public.products(shop_id, is_featured desc, display_order asc);

-- ── Atomic bulk update RPC ──────────────────────────────────────────
-- Called once by the admin "Save Layout Order" button.
-- Runs entirely inside a single DB transaction — no N-write loop from client.
create or replace function public.bulk_update_display_order(
  p_updates jsonb  -- [{"id": "uuid", "display_order": 1}, ...]
) returns void language plpgsql security definer as $$
declare
  v_update jsonb;
begin
  for v_update in select * from jsonb_array_elements(p_updates) loop
    update public.products
       set display_order = (v_update->>'display_order')::int,
           updated_at    = now()
     where id = (v_update->>'id')::uuid;
  end loop;
end;
$$;
