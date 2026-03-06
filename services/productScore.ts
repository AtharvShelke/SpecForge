import { Product } from '@/types'

export function getProductScore(product:Product,rating:any){

  const price = product.variants?.[0]?.price || 0

  const ratingScore = rating?.average || 0
  const reviewScore = rating?.count || 0

  const mediaScore = product.media?.length ? 10 : 0

  const priceScore = price < 50000 ? 5 : 2

  return (

    ratingScore * 20 +
    reviewScore * 2 +
    mediaScore +
    priceScore

  )

}