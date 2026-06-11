create extension if not exists "pgcrypto";

create type public.customer_profile_status as enum (
  'incomplete',
  'pending_review',
  'verified',
  'suspended'
);

create type public.customer_risk_flag as enum (
  'none',
  'has_risk'
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  customer_code_prefix text not null default 'PR-C',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_code text not null,
  full_name text not null check (length(trim(full_name)) > 0),
  line_account text not null default '',
  phone text not null,
  phone_normalized text not null check (phone_normalized ~ '^0[0-9]{9}$'),
  current_address text not null default '',
  notes text not null default '',
  profile_status public.customer_profile_status not null default 'incomplete',
  risk_flag public.customer_risk_flag not null default 'none',
  bust_in numeric(5, 2),
  waist_in numeric(5, 2),
  hip_in numeric(5, 2),
  height_cm numeric(5, 2),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, customer_code),
  unique (shop_id, phone_normalized)
);

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null check (sort_order between 1 and 5),
  created_at timestamptz not null default now(),
  unique (customer_id, sort_order),
  unique (storage_path)
);

create index customers_shop_status_idx on public.customers (shop_id, profile_status) where archived_at is null;
create index customers_shop_search_idx on public.customers (shop_id, customer_code, phone_normalized) where archived_at is null;
create index customer_documents_customer_idx on public.customer_documents (customer_id, sort_order);

create or replace function public.is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.normalize_thai_phone(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g');
$$;

create or replace function public.assign_customer_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number bigint;
  prefix text;
begin
  new.phone_normalized := public.normalize_thai_phone(new.phone);

  if new.phone_normalized !~ '^0[0-9]{9}$' then
    raise exception 'phone_normalized must be a Thai 10 digit phone number';
  end if;

  if new.customer_code is null or new.customer_code = '' then
    perform pg_advisory_xact_lock(hashtext(new.shop_id::text));
    select customer_code_prefix into prefix from public.shops where id = new.shop_id;
    select coalesce(
      max(nullif(regexp_replace(customer_code, '[^0-9]', '', 'g'), '')::bigint),
      0
    ) + 1
    into next_number
    from public.customers
    where shop_id = new.shop_id;

    new.customer_code := coalesce(prefix, 'PR-C') || lpad(next_number::text, 3, '0');
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger customers_assign_defaults
before insert or update of phone, customer_code on public.customers
for each row execute function public.assign_customer_defaults();

create or replace function public.enforce_customer_document_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  select count(*) into current_count
  from public.customer_documents
  where customer_id = new.customer_id
    and id <> coalesce(new.id, gen_random_uuid());

  if current_count >= 5 then
    raise exception 'customer document limit is 5';
  end if;

  if new.storage_path !~ ('^' || new.shop_id::text || '/' || new.customer_id::text || '/') then
    raise exception 'customer document storage_path must start with shop_id/customer_id/';
  end if;

  return new;
end;
$$;

create trigger customer_documents_limit
before insert or update on public.customer_documents
for each row execute function public.enforce_customer_document_limit();

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.customers enable row level security;
alter table public.customer_documents enable row level security;

create policy "owners can manage their shops"
on public.shops for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "owners can read shop members"
on public.shop_members for select
using (public.is_shop_owner(shop_id));

create policy "owners can insert themselves as shop owner"
on public.shop_members for insert
with check (user_id = auth.uid() and role = 'owner');

create policy "owners can manage customers"
on public.customers for all
using (public.is_shop_owner(shop_id))
with check (public.is_shop_owner(shop_id));

create policy "owners can manage customer documents"
on public.customer_documents for all
using (public.is_shop_owner(shop_id))
with check (public.is_shop_owner(shop_id));

insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do update set public = false;

create policy "owners can read customer document files"
on storage.objects for select
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_owner(documents.shop_id)
  )
);

create policy "owners can upload customer document files"
on storage.objects for insert
with check (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.shop_members members
    where members.shop_id::text = split_part(storage.objects.name, '/', 1)
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "owners can update customer document files"
on storage.objects for update
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_owner(documents.shop_id)
  )
)
with check (bucket_id = 'customer-documents');

create policy "owners can delete customer document files"
on storage.objects for delete
using (
  bucket_id = 'customer-documents'
  and exists (
    select 1
    from public.customer_documents documents
    where documents.storage_path = storage.objects.name
      and public.is_shop_owner(documents.shop_id)
  )
);
