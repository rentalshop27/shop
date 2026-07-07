import { describe, expect, it, vi } from 'vitest'
import { createShopMember } from './shopMembersRemote'

describe('shopMembersRemote', () => {
  it('surfaces a deploy-specific message when the edge function is missing', async () => {
    const invoke = vi.fn(() => Promise.resolve({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'Requested function was not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      },
    }))
    const supabase = {
      functions: { invoke },
    }

    await expect(
      createShopMember(supabase as never, 'shop_1', 'staff@example.com', '123456', 'staff'),
    ).rejects.toThrow('ยังไม่ได้ deploy ฟังก์ชัน create-shop-member บน Supabase โปรด deploy ฟังก์ชันนี้ก่อนใช้งาน')
  })

  it('surfaces the function error payload when the backend returns a message', async () => {
    const invoke = vi.fn(() => Promise.resolve({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: new Response(
          JSON.stringify({ error: 'คุณไม่มีสิทธิ์เพิ่มพนักงาน (ต้องเป็นเจ้าของร้านเท่านั้น)' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      },
    }))
    const supabase = {
      functions: { invoke },
    }

    await expect(
      createShopMember(supabase as never, 'shop_1', 'staff@example.com', '123456', 'staff'),
    ).rejects.toThrow('คุณไม่มีสิทธิ์เพิ่มพนักงาน (ต้องเป็นเจ้าของร้านเท่านั้น)')
  })

  it('surfaces backend details when the function returns a handled payload error', async () => {
    const invoke = vi.fn(() => Promise.resolve({
      data: {
        success: false,
        error: 'ไม่สามารถบันทึกสิทธิ์พนักงานได้ กรุณาลองใหม่',
        details: 'duplicate key value violates unique constraint "shop_members_pkey"',
      },
      error: null,
    }))
    const supabase = {
      functions: { invoke },
    }

    await expect(
      createShopMember(supabase as never, 'shop_1', 'staff@example.com', '123456', 'staff'),
    ).rejects.toThrow(
      'ไม่สามารถบันทึกสิทธิ์พนักงานได้ กรุณาลองใหม่\nduplicate key value violates unique constraint "shop_members_pkey"',
    )
  })

  it('translates the old shop_members role constraint into a migration hint', async () => {
    const invoke = vi.fn(() => Promise.resolve({
      data: {
        success: false,
        error: 'ไม่สามารถบันทึกสิทธิ์พนักงานได้ กรุณาลองใหม่',
        details: 'new row for relation "shop_members" violates check constraint "shop_members_role_check"',
      },
      error: null,
    }))
    const supabase = {
      functions: { invoke },
    }

    await expect(
      createShopMember(supabase as never, 'shop_1', 'manager@example.com', '123456', 'manager'),
    ).rejects.toThrow(
      'ฐานข้อมูล Supabase ของระบบเพิ่มพนักงานยังเป็น schema เก่าอยู่ โปรดรัน migration 0033_shop_member_roles_and_permissions.sql แล้วลองใหม่',
    )
  })
})
