alter table public.customer_documents
add column if not exists storage_provider text not null default 'supabase_storage'
  check (storage_provider in ('supabase_storage', 'google_drive')),
add column if not exists external_file_id text,
add column if not exists mime_type text not null default '',
add column if not exists original_file_name text not null default '';

create index if not exists customer_documents_customer_provider_idx
on public.customer_documents (customer_id, storage_provider, sort_order);
