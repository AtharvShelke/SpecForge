import { Product } from '@/types'

export function getProductScore(product: Product) {

  const price = product.variants?.[0]?.price || 0

  const mediaScore = product.media?.length ? 10 : 0

  const priceScore = price < 50000 ? 5 : 2

  return (
    mediaScore +
    priceScore
  )

}