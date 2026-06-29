-- Stable public catalog slugs keep tenant UUIDs out of customer-facing links.

alter table public.shops
add column if not exists public_catalog_slug text;

update public.shops
set public_catalog_slug = 'shop-' || substr(replace(id::text, '-', ''), 1, 12)
where public_catalog_slug is null or btrim(public_catalog_slug) = '';

alter table public.shops
alter column public_catalog_slug set not null;

alter table public.shops
drop constraint if exists shops_public_catalog_slug_format;

alter table public.shops
add constraint shops_public_catalog_slug_format
check (public_catalog_slug ~ '^[a-z0-9][a-z0-9-]{2,62}$');

create unique index if not exists shops_public_catalog_slug_key
on public.shops (public_catalog_slug);
