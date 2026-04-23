import { BuildItem } from '@/types';

/**
 * Calculate the total price for a list of build items.
 * BuildItem is a slot assignment (no quantity) — each item holds one variant.
 */
export function calculateBuildPrice(items: BuildItem[]){

  return items.reduce((total,item)=>{

    return total + (item.variant?.price ?? 0)

  },0)

}