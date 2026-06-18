// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '../customers/customerTypes'
import type { RentalOrder, RentalStatus } from '../rentals/rentalTypes'
import { MultiShopDashboardPage, type OverviewShopData } from './MultiShopDashboardPage'

const costume: RentalOrder['costume'] = {
  id: 'stock_1',
  sku: 'SKU-001',
  serialNumber: 'SN-001',
  productName: 'Midnight Dress',
  brand: 'Precious',
  category: 'ชุดราตรี',
  size: 'M',
  primaryColor: 'น้ำเงิน',
  publicDescription: '',
  setCount: 1,
  rentalPricePerDay: 1200,
  lateFeeRule: '300/day',
  depositAmount: 2000,
  imageUrls: [],
  createdAt: '2026-06-11T00:00:00.000Z',
  status: 'available',
}

function makeCustomer(shopId: string, name: string): Customer {
  return {
    id: `customer_${shopId}`,
    shopId,
    customerCode: `PR-${shopId}`,
    fullName: name,
    lineAccount: '',
    phone: '0987654321',
    phoneNormalized: '0987654321',
    currentAddress: '',
    notes: '',
    profileStatus: 'verified',
    riskFlag: 'none',
    documents: [],
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

function makeRental(
  id: string,
  shopId: string,
  customerName: string,
  collectedAmount: number,
  status: RentalStatus = 'booked',
): RentalOrder {
  return {
    id,
    orderCode: `ORDER-${id}`,
    customer: makeCustomer(shopId, customerName),
    costume: { ...costume, id: `stock_${id}`, sku: `SKU-${id}` },
    pickupDate: '2026-06-18',
    returnDate: status === 'active' ? '2026-06-18' : '2026-06-20',
    rentalPrice: 1200,
    depositAmount: 2000,
    collectedAmount,
    status,
    notes: '',
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }
}

function readyShop(id: string, name: string, rentals: RentalOrder[]): OverviewShopData {
  return {
    shop: { id, name },
    status: 'ready',
    rentals,
    error: '',
  }
}

describe('MultiShopDashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-18T10:00:00+07:00'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('aggregates ready shops and shows each schedule shop name', () => {
    render(
      <MultiShopDashboardPage
        shopsData={[
          readyShop('shop_1', 'Precious Siam', [makeRental('rental_1', 'shop_1', 'Alice', 1000)]),
          readyShop('shop_2', 'Precious Silom', [makeRental('rental_2', 'shop_2', 'Bob', 2500)]),
        ]}
        onEnterShop={vi.fn()}
        preferredShopId={null}
      />,
    )

    const summary = screen.getByRole('region', { name: 'สถิติหลัก' })
    expect(within(summary).getByText('฿3,500')).toBeTruthy()
    expect(within(summary).getByText('2')).toBeTruthy()

    const schedule = screen.getByRole('region', { name: 'งานประจำวัน' })
    expect(within(schedule).getByText('Precious Siam')).toBeTruthy()
    expect(within(schedule).getByText('Precious Silom')).toBeTruthy()
  })

  it('puts the preferred shop first without changing the supplied data', () => {
    const shopsData = [
      readyShop('shop_1', 'Precious Siam', []),
      readyShop('shop_2', 'Precious Silom', []),
    ]

    render(
      <MultiShopDashboardPage
        shopsData={shopsData}
        onEnterShop={vi.fn()}
        preferredShopId="shop_2"
      />,
    )

    const shopCards = screen.getByRole('region', { name: 'รายชื่อสาขา' }).querySelectorAll('.shop-card')
    expect(shopCards[0].textContent).toContain('Precious Silom')
    expect(shopCards[0].textContent).toContain('ร้านล่าสุด')
    expect(shopsData.map((entry) => entry.shop.id)).toEqual(['shop_1', 'shop_2'])
  })

  it('keeps a failed shop enterable and excludes it from the aggregate', () => {
    const onEnterShop = vi.fn()
    render(
      <MultiShopDashboardPage
        shopsData={[
          readyShop('shop_1', 'Precious Siam', [makeRental('rental_1', 'shop_1', 'Alice', 1000)]),
          {
            shop: { id: 'shop_2', name: 'Precious Silom' },
            status: 'error',
            rentals: [],
            error: 'customers unavailable',
          },
        ]}
        onEnterShop={onEnterShop}
        preferredShopId={null}
      />,
    )

    expect(screen.getByText('ยอดรวมนี้ยังไม่รวมข้อมูลจากบางสาขา')).toBeTruthy()
    const summary = screen.getByRole('region', { name: 'สถิติหลัก' })
    expect(within(summary).getByText('฿1,000')).toBeTruthy()

    const failedCard = screen.getByText('Precious Silom').closest('.shop-card')
    expect(failedCard?.textContent).toContain('ข้อมูลภาพรวมของร้านนี้ไม่พร้อม')
    within(failedCard as HTMLElement).getByRole('button', { name: 'เข้าร้านนี้' }).click()
    expect(onEnterShop).toHaveBeenCalledWith('shop_2')
  })

  it('hides aggregate zero values while any shop is loading', () => {
    render(
      <MultiShopDashboardPage
        shopsData={[
          readyShop('shop_1', 'Precious Siam', []),
          {
            shop: { id: 'shop_2', name: 'Precious Silom' },
            status: 'loading',
            rentals: [],
            error: '',
          },
        ]}
        onEnterShop={vi.fn()}
        preferredShopId={null}
      />,
    )

    expect(screen.getByRole('status').textContent).toContain('กำลังโหลดข้อมูลภาพรวมทุกสาขา')
    expect(screen.queryByRole('region', { name: 'สถิติหลัก' })).toBeNull()
    expect(screen.getByText('Precious Silom')).toBeTruthy()
  })
})
