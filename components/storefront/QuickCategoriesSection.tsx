import Link from 'next/link'

const QUICK_CATEGORIES = [
  { label: 'Graphics Cards', category: 'GPU' },
  { label: 'Processors', category: 'PROCESSOR' },
  { label: 'Motherboards', category: 'MOTHERBOARD' },
  { label: 'RAM', category: 'RAM' },
  { label: 'SSD', category: 'STORAGE' },
  { label: 'Cabinets', category: 'CABINET' },
  { label: 'Power Supplies', category: 'PSU' },
  { label: 'Coolers', category: 'COOLER' },
]

export default function QuickCategoriesSection(){

  return(

    <div className="flex flex-wrap justify-center gap-2 mt-4">

      {QUICK_CATEGORIES.map((cat)=>(
        <Link
          key={cat.category}
          href={`/products?category=${cat.category}`}
          className="px-3 py-1.5 text-xs border border-zinc-200 rounded-full bg-zinc-50 hover:bg-zinc-100"
        >
          {cat.label}
        </Link>
      ))}

    </div>

  )

}