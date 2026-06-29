// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { CustomerCatalogPage, type CatalogDisplayItem } from './CustomerCatalogPage'

const catalogItems: CatalogDisplayItem[] = [
  {
    productName: 'Ruby Evening Dress',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'M',
    primaryColor: 'แดง',
    publicDescription: 'ชุดแดงสำหรับออกงาน',
    setCount: 1,
    rentalPricePerDay: 2200,
    imageUrls: [],
    status: 'available',
    publicVisible: true,
    availabilityStatus: 'available',
    createdAt: '2026-06-29T00:00:00.000Z',
  },
  {
    productName: 'Pearl Wedding Gown',
    brand: 'MONTSAND',
    category: 'ชุดแต่งงาน',
    size: 'S',
    primaryColor: 'ขาว',
    publicDescription: 'ชุดแต่งงานผ้าทูล',
    setCount: 1,
    rentalPricePerDay: 3500,
    imageUrls: [],
    status: 'available',
    publicVisible: true,
    availabilityStatus: 'booked',
    createdAt: '2026-06-28T00:00:00.000Z',
  },
]

afterEach(() => {
  cleanup()
})

describe('CustomerCatalogPage filters', () => {
  it('does not duplicate Rental in the hero title when the shop name already includes it', () => {
    render(<CustomerCatalogPage items={catalogItems} rentals={[]} shopName="Precious Rental" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Precious Rental' }),
    ).toBeInTheDocument()
  })

  it('filters customer-visible catalog items by brand, category, color, size, and availability', async () => {
    const user = userEvent.setup()
    render(<CustomerCatalogPage items={catalogItems} rentals={[]} />)

    await user.selectOptions(screen.getByLabelText('Brands'), 'MONTSAND')
    await user.selectOptions(screen.getByLabelText('หมวดหมู่'), 'ชุดแต่งงาน')
    await user.selectOptions(screen.getByLabelText('สี'), 'ขาว')
    await user.selectOptions(screen.getByLabelText('ไซซ์'), 'S')
    await user.selectOptions(screen.getByLabelText('สถานะ'), 'unavailable')

    expect(screen.getByText('Pearl Wedding Gown')).toBeInTheDocument()
    expect(screen.queryByText('Ruby Evening Dress')).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('รายการชุดสำหรับลูกค้า')).getByText('ไม่ว่าง')).toBeInTheDocument()
  })

  it('keeps unavailable items visible when customers choose every status', async () => {
    const user = userEvent.setup()
    render(<CustomerCatalogPage items={catalogItems} rentals={[]} />)

    await user.selectOptions(screen.getByLabelText('สถานะ'), 'available')
    expect(screen.getByText('Ruby Evening Dress')).toBeInTheDocument()
    expect(screen.queryByText('Pearl Wedding Gown')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('สถานะ'), 'all')
    expect(screen.getByText('Ruby Evening Dress')).toBeInTheDocument()
    expect(screen.getByText('Pearl Wedding Gown')).toBeInTheDocument()
  })
})
