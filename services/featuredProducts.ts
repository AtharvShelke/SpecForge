import { Product } from '@/types'
import { getProductScore } from './productScore'


export function getFeaturedProducts(
  products:Product[],
  getRating:(id:string)=>any
){

  return [...products]

    .filter(p=>p.status === 'ACTIVE')

    .map(p=>({

      product:p,
      score:getProductScore(p,getRating(p.id))

    }))

    .sort((a,b)=>b.score - a.score)

    .slice(0,8)

    .map(p=>p.product)

}