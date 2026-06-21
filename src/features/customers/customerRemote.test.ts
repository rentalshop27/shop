// @vitest-environment jsdom

import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from './customerTypes'
import {
  loadAccessibleShops,
  loadCustomerDocumentPreview,
  loadCustomers,
  uploadRemoteCustomerDocuments,
} from './customerRemote'

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

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

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

  it('does not download Google Drive documents while loading the customer list', async () => {
    const row = {
      id: 'customer_1',
      shop_id: 'shop_1',
      customer_code: 'PR-C001',
      full_name: 'นนท์',
      line_account: null,
      phone: '0987654321',
      phone_normalized: '0987654321',
      current_address: null,
      notes: null,
      profile_status: 'verified',
      risk_flag: 'none',
      bust_in: null,
      waist_in: null,
      hip_in: null,
      height_cm: null,
      archived_at: null,
      created_at: '2026-06-13T00:00:00.000Z',
      updated_at: '2026-06-13T00:00:00.000Z',
      customer_documents: [{
        id: 'document_1',
        shop_id: 'shop_1',
        customer_id: 'customer_1',
        storage_path: 'Precious Rental/customer/document.png',
        storage_provider: 'google_drive',
        external_file_id: 'drive_file_1',
        mime_type: 'image/png',
        original_file_name: 'document.png',
        sort_order: 1,
        created_at: '2026-06-13T00:00:00.000Z',
      }],
    }
    const order = vi.fn(() => ({ data: [row], error: null }))
    const is = vi.fn(() => ({ order }))
    const eq = vi.fn(() => ({ is }))
    const select = vi.fn(() => ({ eq }))
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const supabase = {
      from: vi.fn(() => ({ select })),
      storage: { from: vi.fn() },
    } as unknown as SupabaseClient

    const customers = await loadCustomers(supabase, 'shop_1')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(customers[0].documents[0]).toMatchObject({
      id: 'document_1',
      storageProvider: 'google_drive',
    })
    expect(customers[0].documents[0]).not.toHaveProperty('previewUrl')
  })

  it('downloads a Google Drive preview only when requested', async () => {
    const getSession = vi.fn(async () => ({
      data: { session: { access_token: 'session-token' } },
      error: null,
    }))
    const fetchSpy = vi.fn(async () => new Response('image', { status: 200 }))
    const createObjectURL = vi.fn(() => 'blob:drive-preview')
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL)
    const supabase = { auth: { getSession } } as unknown as SupabaseClient

    const result = await loadCustomerDocumentPreview(supabase, {
      id: 'document_1',
      customerId: 'customer_1',
      storagePath: 'Precious Rental/customer/document.png',
      storageProvider: 'google_drive',
      externalFileId: 'drive_file_1',
      sortOrder: 1,
      createdAt: '2026-06-13T00:00:00.000Z',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('google-drive-customer-document?documentId=document_1'),
      { headers: { Authorization: 'Bearer session-token' } },
    )
    expect(result.previewUrl).toBe('blob:drive-preview')
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
    const maybeSingle = vi.fn(() => ({ data: null, error: null }))
    const integrationEqStatus = vi.fn(() => ({ maybeSingle }))
    const integrationEqProvider = vi.fn(() => ({ eq: integrationEqStatus }))
    const integrationEqShop = vi.fn(() => ({ eq: integrationEqProvider }))
    const integrationSelect = vi.fn(() => ({ eq: integrationEqShop }))
    const supabase = {
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn((table: string) => {
        if (table === 'customer_documents') return { insert }
        if (table === 'shop_google_integrations') return { select: integrationSelect }
        throw new Error(`Unexpected table ${table}`)
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

  it('uploads customer documents through the Google Drive function when the shop is connected', async () => {
    const file = new File(['front'], 'id-card-front.png', { type: 'image/png' })
    const maybeSingle = vi.fn(() => ({ data: { id: 'integration_1' }, error: null }))
    const integrationEqStatus = vi.fn(() => ({ maybeSingle }))
    const integrationEqProvider = vi.fn(() => ({ eq: integrationEqStatus }))
    const integrationEqShop = vi.fn(() => ({ eq: integrationEqProvider }))
    const integrationSelect = vi.fn(() => ({ eq: integrationEqShop }))
    const getSession = vi.fn(async () => ({
      data: { session: { access_token: 'session-token' } },
      error: null,
    }))
    const fetchSpy = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
    fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    const supabase = {
      auth: { getSession },
      from: vi.fn((table: string) => {
        if (table === 'shop_google_integrations') return { select: integrationSelect }
        throw new Error(`Unexpected table ${table}`)
      }),
    } as unknown as SupabaseClient

    await uploadRemoteCustomerDocuments(supabase, customer, [file])

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('google-drive-customer-documents-upload'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer session-token' },
        body: expect.any(FormData),
      }),
    )
    const [, request] = fetchSpy.mock.calls[0]
    const body = request?.body as FormData
    expect(body.get('shopId')).toBe('shop_1')
    expect(body.get('customerId')).toBe('customer_1')
    expect(body.getAll('files')).toEqual([file])
    expect(getSession).toHaveBeenCalledTimes(1)
  })
})
