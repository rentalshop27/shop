export type StockItemStatus = 'available' | 'repair' | 'wash'

// ── RentalTier — one pricing package ──

export type RentalTier = {
  days: number;   // duration, e.g. 1, 3, 5, 7
  price: number;  // total price for that package, e.g. 1000, 1500
}

// ── Product (Parent) — shared product data ──

export type Product = {
  id: string
  baseSku: string
  productName: string
  brand: string
  category: string
  primaryColor: string
  publicDescription: string
  rentalTiers: RentalTier[]     // replaces rentalPricePerDay
  lateFeeRule: string
  depositAmount: number
  imageUrls: string[]
  publicVisible: boolean
  isFeatured: boolean
  displayOrder: number
  createdAt: string
}

// ── StockItem (Child) — individual inventory piece ──

export type StockItem = {
  id: string
  shopId: string
  productId: string
  sku: string
  size: string
  status: StockItemStatus
  createdAt: string
}

// StockItem enriched with its parent Product data (for UI)
export type StockItemWithProduct = StockItem & {
  product: Product
}

export type ProductWithStockSummary = Product & {
  stockItems: StockItem[]
}

// ── FlatStockItem (for backwards compatibility with Rentals/Reports) ──

export type FlatStockItem = StockItem & {
  productName: string
  brand: string
  category: string
  primaryColor: string
  rentalTiers: RentalTier[]     // replaces rentalPricePerDay
  lateFeeRule: string
  depositAmount: number
  imageUrls: string[]
  publicVisible: boolean
  isFeatured: boolean
  displayOrder: number
  serialNumber?: string
  setCount?: number
}

// ── Form types ──

export type SizeVariant = {
  size: string
  quantity: number
}

export type ProductDraft = {
  baseSku: string
  productName: string
  brand: string
  category: string
  primaryColor: string
  publicDescription: string
  rentalTiers: RentalTier[]     // replaces rentalPricePerDay: string
  lateFeeRule: string
  depositAmount: string
  imageUrls: string[]
  publicVisible: boolean
  isFeatured: boolean
  displayOrder: number
  variants: SizeVariant[]
}

// Legacy StockDraft kept for edit-single-child scenarios
export type StockDraft = {
  sku: string
  serialNumber: string
  productName: string
  brand: string
  category: string
  size: string
  primaryColor: string
  publicDescription: string
  setCount: string
  rentalPricePerDay: string
  lateFeeRule: string
  depositAmount: string
  imageUrls: string[]
  status: string
  publicVisible: boolean
}
