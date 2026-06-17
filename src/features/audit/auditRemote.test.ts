import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { loadAuditLogs } from './auditRemote'

describe('audit remote', () => {
  it('loads audit logs for the selected shop only', async () => {
    const filters: Array<[string, string]> = []
    const order = vi.fn(() => ({
      data: [
        {
          id: 'audit_1',
          shop_id: 'shop_1',
          user_id: 'user_1',
          user_email: 'owner@example.com',
          table_name: 'customers',
          record_id: 'customer_1',
          action: 'UPDATE',
          old_data: null,
          new_data: { full_name: 'ใหม่' },
          created_at: '2026-06-18T00:00:00.000Z',
        },
      ],
      error: null,
    }))
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { order }
    })
    const select = vi.fn(() => ({ eq }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    const logs = await loadAuditLogs(supabase, 'shop_1')

    expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    expect(select).toHaveBeenCalledWith('*')
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(logs[0]?.shopId).toBe('shop_1')
  })
})
