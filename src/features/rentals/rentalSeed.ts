import type { RentalOrder } from './rentalTypes'
import { demoCustomers } from '../customers/customerSeed'
import type { StockItem } from '../../App'

// Extended stock items to include the "test" dress (SKU: PR-8130) from the user's screenshot
export const demoStockItemsForRentals: StockItem[] = [
  {
    id: 'stock_demo_1',
    sku: 'PR-4791',
    serialNumber: 'MS-001',
    productName: 'ชุดราตรี Midnight Starlight',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'M',
    primaryColor: 'น้ำเงินมิดไนต์',
    publicDescription: 'ชุดราตรียาวโทนเข้มสำหรับงานกลางคืน',
    setCount: 1,
    rentalPricePerDay: 1200,
    lateFeeRule: '300 บาท/วัน',
    depositAmount: 2000,
    imageUrls: [],
    createdAt: '2026-06-11T00:00:00.000Z',
  },
  {
    id: 'stock_demo_2',
    sku: 'PR-8130',
    serialNumber: 'TST-002',
    productName: 'test',
    brand: 'Precious',
    category: 'ชุดราตรี',
    size: 'S',
    primaryColor: 'น้ำเงินมิดไนต์',
    publicDescription: 'ชุดเดรสยาวสำหรับออกงานหรือถ่ายแบบสีแดง',
    setCount: 1,
    rentalPricePerDay: 500,
    lateFeeRule: '150 บาท/วัน',
    depositAmount: 0,
    imageUrls: [],
    createdAt: '2026-06-11T00:00:00.000Z',
  }
]

export const demoRentals: RentalOrder[] = [
  {
    id: 'rent_1',
    orderCode: 'PR-ORD-101',
    customer: demoCustomers[0], // pun
    costume: demoStockItemsForRentals[1], // test (PR-8130)
    pickupDate: '2026-06-11',
    returnDate: '2026-06-13',
    rentalPrice: 500,
    depositAmount: 0,
    collectedAmount: 500,
    status: 'active', // 'ใช้งานอยู่' (meaning currently out with customer)
    notes: 'ช่องทาง: แคตตาล็อก LINE',
    createdAt: '2026-06-11T10:00:00.000Z',
    updatedAt: '2026-06-11T10:00:00.000Z'
  },
  {
    id: 'rent_2',
    orderCode: 'PR-ORD-102',
    customer: demoCustomers[1], // wee
    costume: demoStockItemsForRentals[0], // Midnight Starlight (PR-4791)
    pickupDate: '2026-06-11',
    returnDate: '2026-06-15',
    rentalPrice: 1200,
    depositAmount: 2000,
    collectedAmount: 3200,
    status: 'booked', // 'รอส่งมอบ' (or 'จอง')
    notes: 'มัดจำโอนเรียบร้อย รอคิวส่งขนส่ง',
    createdAt: '2026-06-11T11:00:00.000Z',
    updatedAt: '2026-06-11T11:00:00.000Z'
  }
]
