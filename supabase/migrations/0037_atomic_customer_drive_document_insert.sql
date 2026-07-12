create or replace function public.insert_customer_drive_documents(
  p_shop_id uuid,
  p_customer_id uuid,
  p_documents jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  document jsonb;
  next_sort_order integer;
  inserted_count integer := 0;
begin
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) = 0 then
    raise exception 'customer documents are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));

  if not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and shop_id = p_shop_id
  ) then
    raise exception 'customer does not belong to shop';
  end if;

  if (
    select count(*) + jsonb_array_length(p_documents)
    from public.customer_documents
    where customer_id = p_customer_id
  ) > 5 then
    raise exception 'รูปเอกสารเต็ม 5 รูปต่อลูกค้าแล้ว';
  end if;

  for document in select value from jsonb_array_elements(p_documents)
  loop
    select slot
    into next_sort_order
    from generate_series(1, 5) as slot
    where not exists (
      select 1
      from public.customer_documents
      where customer_id = p_customer_id
        and sort_order = slot
    )
    order by slot
    limit 1;

    insert into public.customer_documents (
      shop_id,
      customer_id,
      storage_path,
      storage_provider,
      external_file_id,
      mime_type,
      original_file_name,
      sort_order
    ) values (
      p_shop_id,
      p_customer_id,
      document->>'storage_path',
      'google_drive',
      document->>'external_file_id',
      document->>'mime_type',
      document->>'original_file_name',
      next_sort_order
    );

    inserted_count := inserted_count + 1;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function public.insert_customer_drive_documents(uuid, uuid, jsonb) from public;
grant execute on function public.insert_customer_drive_documents(uuid, uuid, jsonb) to service_role;
