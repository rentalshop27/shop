// @vitest-environment jsdom

import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Customer } from './customerTypes'
import { loadAccessibleShops, loadCustomers, uploadRemoteCustomerDocuments } from './customerRemote'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'PR-C001',
  fullName: 'นนท์',
  lineAccount: '',
  phone: '0987654321',
  phoneNormalized: '0987654321',
  currentAddress: '',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
}

describe('customer remote', () => {
  it('loads every accessible shop for the authenticated user', async () => {
    const order = vi.fn(() => ({
      data: [
        { id: 'shop_1', name: 'Precious Siam' },
        { id: 'shop_2', name: 'Precious Silom' },
      ],
      error: null,
    }))
    const select = vi.fn(() => ({ order }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    const shops = await loadAccessibleShops(supabase)

    expect(supabase.from).toHaveBeenCalledWith('shops')
    expect(select).toHaveBeenCalledWith('id, name')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(shops).toEqual([
      { id: 'shop_1', name: 'Precious Siam' },
      { id: 'shop_2', name: 'Precious Silom' },
    ])
  })

  it('filters customers by the selected shop id', async () => {
    const filters: Array<[string, string | null]> = []
    const order = vi.fn(() => ({ data: [], error: null }))
    const is = vi.fn((column: string, value: null) => {
      filters.push([column, value])
      return { order }
    })
    const eq = vi.fn((column: string, value: string) => {
      filters.push([column, value])
      return { is }
    })
    const select = vi.fn(() => ({ eq }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    await loadCustomers(supabase, 'shop_1')

    expect(supabase.from).toHaveBeenCalledWith('customers')
    expect(select).toHaveBeenCalledWith('*, customer_documents(*)')
    expect(filters).toEqual([
      ['shop_id', 'shop_1'],
      ['archived_at', null],
    ])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('removes uploaded document files when document row insert fails', async () => {
    const uploadedPaths: string[] = []
    const removedPaths: string[][] = []
    const upload = vi.fn((path: string) => {
      uploadedPaths.push(path)
      return { error: null }
    })
    const remove = vi.fn((paths: string[]) => {
      removedPaths.push(paths)
      return { error: null }
    })
    const insert = vi.fn(() => ({ error: new Error('insert failed') }))
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      from: vi.fn((table: string) => {
        if (table !== 'customer_documents') throw new Error(`Unexpected table ${table}`)
        return { insert }
      }),
    } as unknown as SupabaseClient

    await expect(
      uploadRemoteCustomerDocuments(supabase, customer, [
        new File(['front'], 'id-card-front.png', { type: 'image/png' }),
        new File(['back'], 'id-card-back.png', { type: 'image/png' }),
      ])
    ).rejects.toThrow('insert failed')

    expect(upload).toHaveBeenCalledTimes(2)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(removedPaths[0]).toEqual(uploadedPaths)
  })
})
