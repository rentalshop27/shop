import { SupabaseClient } from '@supabase/supabase-js'

export type ShopMemberRole = 'owner' | 'manager' | 'staff'

export interface ShopMember {
  user_id: string
  email: string
  role: ShopMemberRole
  created_at: string
}

type CreateShopMemberResponse = {
  success?: boolean
  user_id?: string
  error?: unknown
  details?: unknown
}

async function getFunctionInvokeErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const status = context.status

      try {
        const payload = await context.clone().json() as {
          error?: unknown
          message?: unknown
          details?: unknown
        }

        if (status === 404) {
          return 'ยังไม่ได้ deploy ฟังก์ชัน create-shop-member บน Supabase โปรด deploy ฟังก์ชันนี้ก่อนใช้งาน'
        }

        if (typeof payload.error === 'string' && payload.error.trim()) return payload.error
        if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
        if (typeof payload.details === 'string' && payload.details.trim()) return payload.details
      } catch {
        // Fall through to text parsing below.
      }

      try {
        const text = await context.clone().text()
        if (text.trim()) {
          return status === 404
            ? 'ยังไม่ได้ deploy ฟังก์ชัน create-shop-member บน Supabase โปรด deploy ฟังก์ชันนี้ก่อนใช้งาน'
            : text
        }
      } catch {
        // Fall through to the generic error below.
      }
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message

  return 'เกิดข้อผิดพลาดในการเรียกใช้ระบบเพิ่มพนักงาน'
}

function getCreateShopMemberPayloadErrorMessage(payload: CreateShopMemberResponse) {
  const errorMessage = typeof payload.error === 'string' && payload.error.trim()
    ? payload.error.trim()
    : 'เกิดข้อผิดพลาดในการเรียกใช้ระบบเพิ่มพนักงาน'
  const details = typeof payload.details === 'string' ? payload.details.trim() : ''

  if (!details) return errorMessage

  if (
    errorMessage === 'ไม่สามารถบันทึกสิทธิ์พนักงานได้ กรุณาลองใหม่'
    && details === 'Unexpected error'
  ) {
    return 'ระบบเพิ่มพนักงานบันทึกลงฐานข้อมูลไม่ได้ และ Edge Function ฝั่ง Supabase ยังเป็นเวอร์ชันที่ซ่อนสาเหตุจริงอยู่ โปรด deploy ฟังก์ชัน create-shop-member ล่าสุด และตรวจว่า migration 0033_shop_member_roles_and_permissions.sql กับ 0034_manage_shop_members.sql ถูก apply แล้ว'
  }

  const normalizedDetails = details.toLowerCase()
  if (
    normalizedDetails.includes('shop_members_role_check')
    || (
      normalizedDetails.includes('violates check constraint')
      && normalizedDetails.includes('shop_members')
    )
  ) {
    return 'ฐานข้อมูล Supabase ของระบบเพิ่มพนักงานยังเป็น schema เก่าอยู่ โปรดรัน migration 0033_shop_member_roles_and_permissions.sql แล้วลองใหม่'
  }

  return `${errorMessage}\n${details}`
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
    throw new Error(await getFunctionInvokeErrorMessage(error))
  }

  const payload = data as CreateShopMemberResponse | null

  if (payload?.error || payload?.success === false) {
    throw new Error(getCreateShopMemberPayloadErrorMessage(payload ?? {}))
  }

  if (!payload?.user_id) {
    throw new Error('ระบบเพิ่มพนักงานตอบกลับไม่สมบูรณ์ กรุณาลองใหม่')
  }

  return payload.user_id
}
