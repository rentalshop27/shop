do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_shop_id_id_key'
  ) then
    alter table public.customers
    add constraint customers_shop_id_id_key unique (shop_id, id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customer_documents'::regclass
      and conname = 'customer_documents_shop_customer_fk'
  ) then
    alter table public.customer_documents
    add constraint customer_documents_shop_customer_fk
    foreign key (shop_id, customer_id)
    references public.customers(shop_id, id)
    on delete cascade;
  end if;
end $$;
