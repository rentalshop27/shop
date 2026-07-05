import type { RentalOrder } from '../rentals/rentalTypes'
import type { StockItem } from '../inventory/inventoryTypes'
import { getInventoryDisplayStatus } from '../inventory/inventoryStatus'

export type CatalogSizeSummary = {
  size: string
  total: number
  available: number
}

export function buildCatalogSizeSummary(
  stockItems: StockItem[],
  rentals: RentalOrder[],
  today: string,
): CatalogSizeSummary[] {
  const sizeMap = new Map<string, CatalogSizeSummary>()

  for (const stockItem of stockItems) {
    const current = sizeMap.get(stockItem.size) ?? {
      size: stockItem.size,
      total: 0,
      available: 0,
    }

    current.total += 1

    if (getInventoryDisplayStatus(stockItem, rentals, today).primaryStatus === 'available') {
      current.available += 1
    }

    sizeMap.set(stockItem.size, current)
  }

  return Array.from(sizeMap.values())
}
