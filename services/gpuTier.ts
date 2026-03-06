export type GpuTier = 'BUDGET' | 'MID' | 'ENTHUSIAST'

export function getGpuTier(price:number):GpuTier{

  if(price < 20000) return 'BUDGET'
  if(price < 60000) return 'MID'
  return 'ENTHUSIAST'

}