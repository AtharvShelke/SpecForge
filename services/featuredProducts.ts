import { Product } from '@/types'

export function getFeaturedProducts(products: Product[]) {
  const categories = ['GPU', 'PROCESSOR', 'MOTHERBOARD'];

  const featuredProducts = categories
    .map(category => {
      return products
        .filter(p => p.category === category)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]; // latest product
    })
    .filter(Boolean);

  

  return featuredProducts;
}