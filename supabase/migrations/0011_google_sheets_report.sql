alter table public.shop_google_integrations
add column if not exists report_spreadsheet_id text,
add column if not exists report_spreadsheet_url text;
