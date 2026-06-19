export type StockItemStatus = 'available' | 'repair' | 'wash'

export type StockItem = {
  id: string
  sku: string
  serialNumber: string
  productName: string
  brand: string
  category: string
  size: string
  primaryColor: string
  publicDescription: string
  setCount: number
  rentalPricePerDay: number
  lateFeeRule: string
  depositAmount: number
  imageUrls: string[]
  status: StockItemStatus
  createdAt: string
}

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
}
