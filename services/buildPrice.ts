interface BuildItem{
  variant:{
    price:number
  }
  quantity:number
}

export function calculateBuildPrice(items:BuildItem[]){

  return items.reduce((total,item)=>{

    return total + item.variant.price * item.quantity

  },0)

}