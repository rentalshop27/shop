// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CustomerCatalogPage,
  reorderCatalogEditOrder,
  type CatalogDisplayItem,
} from './CustomerCatalogPage'

const catalogItems: CatalogDisplayItem[] = [
  {
    productName: 'Ruby Evening Dress',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'M',
    primaryColor: 'แดง',
    publicDescription: 'A sharp suit',
    rentalTiers: [{days: 1, price: 2000}],
    imageUrls: ['https://example.com/img2.jpg'],
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
    publicDescription: 'A very nice dress',
    rentalTiers: [{days: 1, price: 1500}],
    imageUrls: ['https://example.com/img1.jpg'],
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
    expect(within(screen.getByLabelText('รายการชุดสำหรับลูกค้า')).getByText('฿1,500')).toBeInTheDocument()
  })

  it('splits comma-separated categories into separate filter options', async () => {
    const user = userEvent.setup()
    render(
      <CustomerCatalogPage
        items={[
          ...catalogItems,
          {
            productName: 'Midnight Suit Set',
            brand: 'Precious',
            category: 'ชุดราตรี, ชุดสูท',
            size: 'L',
            primaryColor: 'ดำ',
            publicDescription: 'Two categories in one field',
            rentalTiers: [{ days: 1, price: 2500 }],
            imageUrls: ['https://example.com/img3.jpg'],
            publicVisible: true,
            availabilityStatus: 'available',
            createdAt: '2026-06-30T00:00:00.000Z',
          },
        ]}
        rentals={[]}
      />,
    )

    const categoryFilter = screen.getByLabelText('หมวดหมู่')
    const categoryOptions = within(categoryFilter).getAllByRole('option').map((option) => option.textContent)

    expect(categoryOptions).toContain('ชุดราตรี')
    expect(categoryOptions).toContain('ชุดสูท')
    expect(categoryOptions).not.toContain('ชุดราตรี, ชุดสูท')

    await user.selectOptions(categoryFilter, 'ชุดสูท')
    expect(screen.getByText('Midnight Suit Set')).toBeInTheDocument()
    expect(screen.queryByText('Ruby Evening Dress')).not.toBeInTheDocument()
    expect(screen.queryByText('Pearl Wedding Gown')).not.toBeInTheDocument()
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

  it('renders hero background upload guidance in admin preview mode', () => {
    render(
      <CustomerCatalogPage
        items={catalogItems}
        rentals={[]}
        onUploadHeroBackground={() => undefined}
        onUploadMobileHeroBackground={() => undefined}
      />,
    )

    expect(screen.getByText('รูปพื้นหลังส่วนชื่อร้าน')).toBeInTheDocument()
    expect(screen.getByText('ใช้จริงขั้นต่ำ: 1600 x 600 px')).toBeInTheDocument()
    expect(screen.getByText('รูปมือถือแยก: 1080 x 720 px ใช้แสดงบนหน้าจอมือถือ')).toBeInTheDocument()
    expect(screen.getByText('อัปโหลดรูป Desktop BG')).toBeInTheDocument()
    expect(screen.getByText('อัปโหลดรูป Mobile BG')).toBeInTheDocument()
  })

  it('renders custom hero backgrounds through desktop and mobile CSS variables without an inline wash overlay', () => {
    const { container } = render(
      <CustomerCatalogPage
        items={catalogItems}
        rentals={[]}
        heroBackgroundUrl="https://example.com/hero.webp"
        mobileHeroBackgroundUrl="https://example.com/mobile-hero.webp"
      />,
    )

    const hero = container.querySelector('.prc-hero') as HTMLElement | null

    expect(hero).not.toBeNull()
    if (!hero) return
    expect(hero.style.getPropertyValue('--prc-hero-bg-image')).toBe("url('https://example.com/hero.webp')")
    expect(hero.style.getPropertyValue('--prc-hero-mobile-bg-image')).toBe("url('https://example.com/mobile-hero.webp')")
    expect(hero.getAttribute('style')).not.toContain('linear-gradient')
  })

  it('keeps featured items above standard items in edit-mode reordering', () => {
    const items: CatalogDisplayItem[] = [
      { ...catalogItems[0], id: 'featured_1', isFeatured: true },
      { ...catalogItems[1], id: 'featured_2', isFeatured: true },
      { ...catalogItems[0], id: 'standard_1', isFeatured: false },
    ]

    expect(
      reorderCatalogEditOrder(
        ['featured_1', 'featured_2', 'standard_1'],
        items,
        'featured_2',
        'standard_1',
      ),
    ).toEqual(['featured_1', 'featured_2', 'standard_1'])
  })

  it('still allows reordering inside the same featured group', () => {
    const items: CatalogDisplayItem[] = [
      { ...catalogItems[0], id: 'featured_1', isFeatured: true },
      { ...catalogItems[1], id: 'featured_2', isFeatured: true },
      { ...catalogItems[0], id: 'standard_1', isFeatured: false },
    ]

    expect(
      reorderCatalogEditOrder(
        ['featured_1', 'featured_2', 'standard_1'],
        items,
        'featured_2',
        'featured_1',
      ),
    ).toEqual(['featured_2', 'featured_1', 'standard_1'])
  })
})
