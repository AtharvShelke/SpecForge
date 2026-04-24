import Link from 'next/link'

const QUICK_CATEGORIES = [
  { label: 'Graphics Cards', category: 'Graphics Card' },
  { label: 'Processors', category: 'Processor' },
  { label: 'Motherboards', category: 'Motherboard' },
  { label: 'RAM', category: 'RAM' },
  { label: 'SSD', category: 'Storage' },
  { label: 'Cabinets', category: 'Cabinet' },
  { label: 'Power Supplies', category: 'Power Supply' },
  { label: 'Coolers', category: 'Cooler' },
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