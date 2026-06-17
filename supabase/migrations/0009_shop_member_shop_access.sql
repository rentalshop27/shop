create policy "shop members can read accessible shops"
on public.shops for select
using (public.is_shop_owner(id));

create policy "shop members can update accessible shops"
on public.shops for update
using (public.is_shop_owner(id))
with check (public.is_shop_owner(id));
