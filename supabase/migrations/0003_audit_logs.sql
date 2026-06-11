-- Create audit_logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Index for querying shop audit logs ordered by creation time
create index audit_logs_shop_created_at_idx on public.audit_logs (shop_id, created_at desc);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policy: Only shop owners/members can read their shop's audit logs
create policy "owners can read shop audit logs"
on public.audit_logs for select
using (public.is_shop_owner(shop_id));

-- Trigger function to automatically log audit events
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_shop_id uuid;
  record_id uuid;
  old_json jsonb := null;
  new_json jsonb := null;
begin
  -- Get user ID and email from Supabase authentication context
  current_user_id := auth.uid();
  
  if TG_OP = 'INSERT' then
    current_shop_id := NEW.shop_id;
    record_id := NEW.id;
    new_json := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    current_shop_id := NEW.shop_id;
    record_id := NEW.id;
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
  elsif TG_OP = 'DELETE' then
    current_shop_id := OLD.shop_id;
    record_id := OLD.id;
    old_json := to_jsonb(OLD);
  end if;

  begin
    insert into public.audit_logs (
      shop_id,
      user_id,
      user_email,
      table_name,
      record_id,
      action,
      old_data,
      new_data
    ) values (
      current_shop_id,
      current_user_id,
      coalesce(auth.jwt() ->> 'email', 'system'),
      TG_TABLE_NAME,
      record_id,
      TG_OP,
      old_json,
      new_json
    );
  exception when others then
    -- Fail-safe to ensure that errors in the audit log insertion 
    -- do not break the main transaction (customers, rentals, etc.)
  end;

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Create audit triggers for public.customers
create trigger audit_customers_trigger
after insert or update or delete
on public.customers
for each row execute function public.log_audit_event();

-- Create audit triggers for public.customer_documents
create trigger audit_customer_documents_trigger
after insert or update or delete
on public.customer_documents
for each row execute function public.log_audit_event();

-- Create audit triggers for public.rentals
create trigger audit_rentals_trigger
after insert or update or delete
on public.rentals
for each row execute function public.log_audit_event();
