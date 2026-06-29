// @vitest-environment jsdom

import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from './customerTypes'
import {
  loadAccessibleShops,
  loadCustomerDocumentPreview,
  loadCustomers,
  deleteRemoteCustomerDocuments,
  archiveRemoteCustomer,
  updateRemoteCustomer,
  updateRemoteCustomerRisk,
  updateRemoteCustomerStatus,
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
        { id: 'shop_1', name: 'Precious Siam', public_catalog_slug: 'precious-siam' },
        { id: 'shop_2', name: 'Precious Silom', public_catalog_slug: null },
      ],
      error: null,
    }))
    const select = vi.fn(() => ({ order }))
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient

    const shops = await loadAccessibleShops(supabase)

    expect(supabase.from).toHaveBeenCalledWith('shops')
    expect(select).toHaveBeenCalledWith('id, name, public_catalog_slug')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(shops).toEqual([
      { id: 'shop_1', name: 'Precious Siam', publicCatalogSlug: 'precious-siam' },
      { id: 'shop_2', name: 'Precious Silom', publicCatalogSlug: null },
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
    expect(select).toHaveBeenCalledWith('*, customer_documents!customer_documents_shop_customer_fk(*)')
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

  it('uploads replacement documents into the lowest available sort order slot', async () => {
    const insertedRows: Array<{ sort_order: number }> = []
    const upload = vi.fn(() => ({ error: null }))
    const remove = vi.fn(() => ({ error: null }))
    const insert = vi.fn((rows: Array<{ sort_order: number }>) => {
      insertedRows.push(...rows)
      return { error: null }
    })
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

    await uploadRemoteCustomerDocuments(
      supabase,
      {
        ...customer,
        documents: [1, 3, 4, 5].map((sortOrder) => ({
          id: `document_${sortOrder}`,
          customerId: customer.id,
          storagePath: `${customer.shopId}/${customer.id}/document-${sortOrder}.png`,
          storageProvider: 'supabase_storage',
          sortOrder,
          createdAt: '2026-06-13T00:00:00.000Z',
        })),
      },
      [new File(['front'], 'id-card-front.png', { type: 'image/png' })],
    )

    expect(insertedRows).toHaveLength(1)
    expect(insertedRows[0].sort_order).toBe(2)
  })

  it('scopes customer edits by id and selected shop id', async () => {
    const filters: Array<[string, string]> = []
    const row = {
      id: 'customer_1',
      shop_id: 'shop_1',
      customer_code: 'PR-C001',
      full_name: 'นนท์',
      line_account: '',
      phone: '0987654321',
      phone_normalized: '0987654321',
      current_address: '',
      notes: '',
      profile_status: 'verified',
      risk_flag: 'none',
      bust_in: null,
      waist_in: null,
      hip_in: null,
      height_cm: null,
      archived_at: null,
      created_at: '2026-06-13T00:00:00.000Z',
      updated_at: '2026-06-13T00:00:00.000Z',
      customer_documents: [],
    }
    const single = vi.fn(() => ({ data: row, error: null }))
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return query
      }),
      select: vi.fn(() => ({ single })),
    }
    const update = vi.fn(() => query)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await updateRemoteCustomer(supabase, 'shop_1', 'customer_1', {
      fullName: 'นนท์',
      lineAccount: '',
      phone: '0987654321',
      currentAddress: '',
      notes: '',
      profileStatus: 'verified',
      riskFlag: 'none',
      bustIn: '',
      waistIn: '',
      hipIn: '',
      heightCm: '',
    })

    expect(filters).toEqual([
      ['id', 'customer_1'],
      ['shop_id', 'shop_1'],
    ])
    expect(query.select).toHaveBeenCalledWith('*, customer_documents!customer_documents_shop_customer_fk(*)')
    expect(single).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['status', (supabase: SupabaseClient) => updateRemoteCustomerStatus(supabase, 'shop_1', 'customer_1', 'verified')],
    ['risk flag', (supabase: SupabaseClient) => updateRemoteCustomerRisk(supabase, 'shop_1', 'customer_1', 'has_risk')],
    ['archive', (supabase: SupabaseClient) => archiveRemoteCustomer(supabase, 'shop_1', 'customer_1')],
  ])('scopes quick customer %s updates by selected shop id', async (_label, action) => {
    const filters: Array<[string, string]> = []
    const single = vi.fn(() => ({ data: { id: 'customer_1' }, error: null }))
    const query = {
      eq: vi.fn((column: string, value: string) => {
        filters.push([column, value])
        return query
      }),
      select: vi.fn(() => ({ single })),
    }
    const update = vi.fn(() => query)
    const supabase = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient

    await action(supabase)

    expect(filters).toEqual([
      ['id', 'customer_1'],
      ['shop_id', 'shop_1'],
    ])
    expect(query.select).toHaveBeenCalledWith('id')
  })

  it('removes customer document rows before best-effort storage cleanup', async () => {
    const calls: string[] = []
    const filters: Array<[string, string]> = []
    const remove = vi.fn((paths: string[]) => {
      calls.push(`storage:${paths.join(',')}`)
      return { error: null }
    })
    const query = {
      eq: vi.fn((column: string, value: string) => {
        calls.push(`db:eq:${column}`)
        filters.push([column, value])
        return query
      }),
      in: vi.fn((column: string, values: string[]) => {
        calls.push(`db:in:${column}:${values.join(',')}`)
        return { error: null }
      }),
    }
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
      from: vi.fn(() => ({ delete: vi.fn(() => query) })),
    } as unknown as SupabaseClient

    await deleteRemoteCustomerDocuments(supabase, 'shop_1', [{
      id: 'document_1',
      customerId: 'customer_1',
      storagePath: 'shop_1/customer_1/document.png',
      storageProvider: 'supabase_storage',
      sortOrder: 1,
      createdAt: '2026-06-13T00:00:00.000Z',
    }])

    expect(supabase.from).toHaveBeenCalledWith('customer_documents')
    expect(filters).toEqual([['shop_id', 'shop_1']])
    expect(calls).toEqual([
      'db:eq:shop_id',
      'db:in:id:document_1',
      'storage:shop_1/customer_1/document.png',
    ])
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
