'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { CategoryNode, Category, CATEGORY_LABELS } from '@/types'

// Use actual hardware images instead of icons for a premium feel
const CATEGORY_IMAGES: Record<string, string> = {
    PROCESSOR: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1924&auto=format&fit=crop',
    GPU: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2070&auto=format&fit=crop',
    MOTHERBOARD: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    RAM: 'https://imgs.search.brave.com/j2XqNWJP024qK2Hp_lZqk49_WbqMLUBtimW_FS59yj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9SR0It/UmFtLVBORy1JbWFn/ZS5wbmc',
    STORAGE: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?q=80&w=1974&auto=format&fit=crop',
    CABINET: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=2070&auto=format&fit=crop',
    PSU: 'https://images.unsplash.com/photo-1517055745147-91a5efd24d9c?q=80&w=2070&auto=format&fit=crop',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=2000&auto=format&fit=crop'

interface Props {
    categories: CategoryNode[]
    productCounts?: Record<string, number>
}

export default function CategorySection({ categories, productCounts }: Props) {
    // Show select categories for a mixed grid, or fallback
    const cats: any[] = categories?.length
        ? categories.filter(c => ['GPU', 'PROCESSOR', 'MOTHERBOARD', 'RAM', 'STORAGE', 'CABINET'].includes(c.category as string))
        : Object.values(Category).slice(0, 6).map(c => ({
            category: c,
            label: CATEGORY_LABELS[c as Category],
            children: [],
        }))

    // Pad to exactly 6 elements if missing
    while (cats.length < 6 && cats.length > 0) {
        cats.push(cats[cats.length - 1])
    }

    // A mixed layout mapping for grid spans
    const getGridStyles = (index: number) => {
        switch (index) {
            case 0: return 'col-span-12 md:col-span-8 row-span-2' // Largest featured
            case 1: return 'col-span-12 md:col-span-4 row-span-1'
            case 2: return 'col-span-12 md:col-span-4 row-span-1'
            case 3: return 'col-span-12 md:col-span-4 row-span-1'
            case 4: return 'col-span-6 md:col-span-4 row-span-1'
            case 5: return 'col-span-6 md:col-span-4 row-span-1'
            default: return 'col-span-6 md:col-span-4'
        }
    }

    return (
        <section className="py-24 bg-white overflow-hidden" id="categories">
            <Container>
                {/* Header with reveal animation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-12"
                >
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter mb-4">
                            Explore the Ecosystem.
                        </h2>
                        <p className="text-zinc-500 text-lg md:text-xl font-light">
                            Discover premium components for every build. High-performance hardware categorized for an uncompromising experience.
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="group mt-6 md:mt-0 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
                    >
                        Browse Catalog
                        <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Mixed Asymmetric Grid */}
                <div className="grid grid-cols-12 auto-rows-[240px] gap-4 md:gap-6">
                    {cats.slice(0, 6).map((cat, i) => {
                        const catKey = cat.category || ''
                        const bgImage = CATEGORY_IMAGES[catKey] || FALLBACK_IMAGE
                        const count = productCounts?.[catKey]

                        return (
                            <motion.div
                                key={catKey + i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className={`${getGridStyles(i)} group relative overflow-hidden rounded-3xl bg-zinc-100 flex flex-col justify-end p-6 cursor-pointer`}
                            >
                                <Link href={`/products?category=${catKey}`} className="absolute inset-0 z-20">
                                    <span className="sr-only">Shop {cat.label}</span>
                                </Link>

                                {/* Background Image with zoom on hover */}
                                <img
                                    src={bgImage}
                                    alt={cat.label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />

                                {/* Gradient overlays for legibility */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                                <div className="absolute inset-0 bg-indigo-900/40 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Content overlaid */}
                                <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 shadow-black/50 drop-shadow-lg">
                                        {cat.label}
                                    </h3>

                                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        <p className="text-sm font-medium text-zinc-300">
                                            {count !== undefined ? `${count} Premium Products` : 'Explore Hardware'}
                                        </p>
                                        <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center">
                                            <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </Container>
        </section>
    )
}
