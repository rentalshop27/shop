# Supabase Setup

Run `supabase/migrations/0001_customer_module.sql` in Supabase SQL editor or through the Supabase CLI.

The customer document bucket is private:

- bucket: `customer-documents`
- object path format: `<shop_id>/<customer_id>/<file-name>`
- database table: `customer_documents.storage_path`

The frontend only uses the anon key. Do not expose a service role key in Cloudflare Pages.
