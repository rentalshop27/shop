-- Function to list shop members along with their emails from auth.users
create or replace function public.get_shop_members(p_shop_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if caller has permission (owner or manager, let's say only owner can manage staff, but managers might need to see them?)
  -- Based on the user's requirements, only owners should manage staff. Let's allow owners to view.
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: Only shop owners can view members';
  end if;

  return query
  select 
    sm.user_id,
    u.email::text,
    sm.role,
    sm.created_at
  from public.shop_members sm
  join auth.users u on u.id = sm.user_id
  where sm.shop_id = p_shop_id
  order by sm.created_at asc;
end;
$$;

-- Function to remove a shop member
create or replace function public.remove_shop_member(p_shop_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
  v_owner_count int;
begin
  if not public.is_shop_owner(p_shop_id) then
    raise exception 'Unauthorized: Only shop owners can remove members';
  end if;

  select role into v_target_role from public.shop_members where shop_id = p_shop_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'User is not a member of this shop';
  end if;

  if v_target_role = 'owner' then
    select count(*) into v_owner_count from public.shop_members where shop_id = p_shop_id and role = 'owner';
    if v_owner_count <= 1 then
      raise exception 'Cannot remove the last owner of the shop';
    end if;
  end if;

  delete from public.shop_members where shop_id = p_shop_id and user_id = p_user_id;
end;
$$;
