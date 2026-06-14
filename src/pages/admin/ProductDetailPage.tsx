import { ProductDetailPage } from '@/pages/shared/ProductDetailPage'

export function AdminProductDetailPage() {
  return <ProductDetailPage backPath="/admin/products" showStockAdjustment />
}
