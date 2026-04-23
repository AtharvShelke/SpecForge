import { Product } from '@/types'
import { getGpuTier, GpuTier } from './gpuTier'

export function filterGpuTier(products:Product[],tier:GpuTier){

  return products.filter(p=>{

    if(p.subCategory?.category?.name !== 'GPU') return false

    const price = p.variants?.[0]?.price || 0

    return getGpuTier(price) === tier

  })

}