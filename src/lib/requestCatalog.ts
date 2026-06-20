import type { ProductStockStatus } from '@/types/product'

export type ProductStockFilter = 'all' | ProductStockStatus

export const stockFilterLabels: Record<ProductStockFilter, string> = {
  all: 'All stock',
  instock: 'In stock',
  outofstock: 'Out of stock',
}
