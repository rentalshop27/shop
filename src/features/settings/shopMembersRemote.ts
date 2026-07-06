import { SupabaseClient } from '@supabase/supabase-js'

export type ShopMemberRole = 'owner' | 'manager' | 'staff'

export interface ShopMember {
  user_id: string
  email: string
  role: ShopMemberRole
  created_at: string
}

export async function getShopMembers(
  supabase: SupabaseClient,
  shopId: string
): Promise<ShopMember[]> {
  const { data, error } = await supabase.rpc('get_shop_members', {
    p_shop_id: shopId,
  })

  if (error) {
    console.error('Error fetching shop members:', error)
    throw new Error(error.message)
  }

  return data as ShopMember[]
}

export async function removeShopMember(
  supabase: SupabaseClient,
  shopId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('remove_shop_member', {
    p_shop_id: shopId,
    p_user_id: userId,
  })

  if (error) {
    console.error('Error removing shop member:', error)
    throw new Error(error.message)
  }
}

export async function createShopMember(
  supabase: SupabaseClient,
  shopId: string,
  email: string,
  password: string,
  role: ShopMemberRole
): Promise<string> {
  // Call the Edge Function
  const { data, error } = await supabase.functions.invoke('create-shop-member', {
    body: {
      shopId,
      email,
      password,
      role
    }
  })

  if (error) {
    console.error('Error invoking create-shop-member function:', error)
    throw new Error(error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data.user_id
}
