'use client'

import Link from 'next/link'
import { memo, useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { CategoryNode } from '@/types'

// ── Constants (outside component — never recreated) ───────────────────────────

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop', // Liquid cooling / RGB
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1200&auto=format&fit=crop', // Clean processor/mobo setup
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop', // Tech abstract / circuit
    'https://images.unsplash.com/photo-1603481586273-2f908a50c263?q=80&w=1200&auto=format&fit=crop', // Clean gaming setup
]

const getFallbackImage = (index: number) => FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
// Animation variants (defined once, outside component)
const cardVariants = {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1    },
}

const headerVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0  },
}

const getGridStyle = (index: number) => {
    const styles = [
        'col-span-12 md:col-span-6 md:row-span-2',   // Large featured on left
        'col-span-12 md:col-span-6 md:row-span-1',   // Wide horizontal on right top
        'col-span-6  md:col-span-3 md:row-span-1',   // Small square on right bottom left
        'col-span-6  md:col-span-3 md:row-span-1',   // Small square on right bottom right
    ]
    return styles[index] || 'col-span-6 md:col-span-3'
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface CardProps {
    cat:      { category: string; label: string; image?: string | null }
    index:    number
    count?:   number
    priority: boolean
}

const CategoryCard = memo(function CategoryCard({ cat, index, count, priority }: CardProps) {
   

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`
                ${getGridStyle(index)}
                group relative overflow-hidden
                rounded-xl sm:rounded-2xl md:rounded-3xl
                bg-zinc-100 flex flex-col justify-end
                p-3 sm:p-4 md:p-6 cursor-pointer
            `}
        >
            <Link href={`/products?category=${cat.category}`} className="absolute inset-0 z-20">
                <span className="sr-only">Shop {cat.label}</span>
            </Link>

            {/* Background image */}
            <img
                src={cat.image || getFallbackImage(index)}
                alt={cat.label}
                width={800}
                height={600}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'low'}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-indigo-900/40 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Text */}
            <div className="relative z-10 sm:translate-y-4 sm:group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-lg sm:text-xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                    {cat.label}
                </h3>
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <p className="text-sm font-medium text-zinc-300">
                        {count !== undefined ? `${count} Premium Products` : 'Explore Hardware'}
                    </p>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={14} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
})

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
    categories?:    CategoryNode[]
    productCounts?: Record<string, number>
}

export default function CategorySection({ productCounts }: Props) {
    const [categories, setCategories] = useState<any[]>([])

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories")
            const data = await res.json()
            console.log("Categories Fetched: ", data)
            setCategories(data)
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        }
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    const cats = useMemo(() => {
        return categories.slice(0, 4).map(c => ({
            category: (c.code || c.category?.code || c.slug || '').toLowerCase(),
            label: c.label || c.name || '',
            image: c.image || null,
        }))
    }, [categories])

    return (
        <section className="py-10 sm:py-20 md:py-24 bg-white overflow-hidden" id="categories">
            <Container>
                {/* Header */}
                <motion.div
                    variants={headerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 md:mb-12"
                >
                    <div className="max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-zinc-950 tracking-tight sm:tracking-tighter mb-3 sm:mb-4">
                            Explore the Ecosystem.
                        </h2>
                        <p className="text-zinc-500 text-sm sm:text-base md:text-xl font-light">
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

                {/* Grid */}
                <div className="grid grid-cols-12 auto-rows-[140px] sm:auto-rows-[180px] md:auto-rows-[240px] gap-3 sm:gap-4 md:gap-6">
                    {cats.map((cat, i) => (
                        <CategoryCard
                            key={cat.category}
                            cat={cat}
                            index={i}
                            count={productCounts?.[cat.category]}
                            priority={i === 0}
                        />
                    ))}
                </div>
            </Container>
        </section>
    )
}
