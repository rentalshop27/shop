create table public.shop_google_integrations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  google_email text not null check (length(trim(google_email)) > 0),
  google_user_id text not null default '',
  connection_status text not null default 'connected' check (connection_status in ('connected', 'revoked', 'error')),
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  last_sync_at timestamptz,
  last_sync_status text not null default 'idle' check (last_sync_status in ('idle', 'success', 'error')),
  last_sync_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, provider),
  unique (shop_id, id)
);

create index shop_google_integrations_shop_idx
on public.shop_google_integrations (shop_id, provider);

alter table public.shop_google_integrations enable row level security;

create policy "owners can read shop google integrations"
on public.shop_google_integrations for select
using (public.is_shop_owner(shop_id));

create table public.shop_google_integration_tokens (
  integration_id uuid not null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  token_type text not null default 'Bearer',
  scope text[] not null default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (integration_id),
  foreign key (shop_id, integration_id)
    references public.shop_google_integrations(shop_id, id)
    on delete cascade
);

create index shop_google_integration_tokens_shop_idx
on public.shop_google_integration_tokens (shop_id);

alter table public.shop_google_integration_tokens enable row level security;
