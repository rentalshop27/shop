// @vitest-environment jsdom

import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Customer } from './customerTypes'
import { uploadRemoteCustomerDocuments } from './customerRemote'

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
