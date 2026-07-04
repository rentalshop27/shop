import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { deleteRemoteRental, updateRemoteRentalStatus } from './rentalRemote'

describe('rentalRemote', () => {
  it('scopes rental status updates by shop id and rental ids', async () => {
    const filters: Array<[string, string]> = []
    const updateQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return updateQuery
      }),
      in: vi.fn(() => ({ error: null })),
    }
    const update = vi.fn(() => updateQuery)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteRentalStatus(supabase, 'shop_1', ['rental_1', 'rental_2'], 'returned')

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'returned',
        updated_at: expect.any(String),
      }),
    )
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(updateQuery.in).toHaveBeenCalledWith('id', ['rental_1', 'rental_2'])
  })

  it('persists outbound and return shipping fields without overloading tracking_number', async () => {
    const updateQuery = {
      eq: vi.fn(() => updateQuery),
      in: vi.fn(() => ({ error: null })),
    }
    const update = vi.fn(() => updateQuery)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteRentalStatus(
      supabase,
      'shop_1',
      ['rental_1'],
      'returned',
      {
        method: 'thailand_post',
        trackingNumber: 'TH1234',
        returnTrackingNote: 'ลูกค้าส่งกลับทาง Kerry'
      }
    )

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'returned',
        shipping_method: 'thailand_post',
        tracking_number: 'TH1234',
        return_tracking_note: 'ลูกค้าส่งกลับทาง Kerry',
        updated_at: expect.any(String),
      }),
    )
  })

  it('scopes rental deletes by shop id and rental ids', async () => {
    const filters: Array<[string, string]> = []
    const deleteQuery = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return deleteQuery
      }),
      in: vi.fn(() => ({ error: null })),
    }
    const remove = vi.fn(() => deleteQuery)
    const supabase = {
      from: vi.fn(() => ({ delete: remove })),
    } as unknown as SupabaseClient

    await deleteRemoteRental(supabase, 'shop_1', ['rental_1'])

    expect(remove).toHaveBeenCalledTimes(1)
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(deleteQuery.in).toHaveBeenCalledWith('id', ['rental_1'])
  })
})
