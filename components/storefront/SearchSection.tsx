'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Container } from '@/components/layout/Container'
import QuickCategoriesSection from './QuickCategoriesSection'

export default function SearchSection(){

  const router = useRouter()
  const [query,setQuery] = useState('')

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault()

    if(!query.trim()) return

    router.push(`/products?q=${encodeURIComponent(query)}`)
  }

  return(

    <section className="bg-white border-b border-zinc-100 py-6">

      <Container>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto relative"
        >

          <Search className="absolute left-4 top-3 text-zinc-400"/>

          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="Search GPUs, CPUs, RAM, SSDs, PC Builds..."
            className="w-full h-12 pl-12 pr-24 rounded-xl border border-zinc-200"
          />

          <button
            type="submit"
            className="absolute right-1 top-1 h-10 px-5 bg-zinc-900 text-white rounded-lg"
          >
            Search
          </button>

        </form>

        <QuickCategoriesSection/>

      </Container>

    </section>

  )

}