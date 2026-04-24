'use client'

import Link from 'next/link'
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { CategoryHierarchy } from '@/types'
import Image from 'next/image'

const CATEGORY_IMAGES: Record<string, string> = {
    PROCESSOR: '/images/category_section/proc.avif',
    GPU: '/images/category_section/gpu.avif',
    MOTHERBOARD: '/images/category_section/mobo.avif',
    RAM: '/images/category_section/ram.webp',
    STORAGE: '/images/category_section/drive.avif',
    CABINET: '/images/category_section/cab.avif',
    MONITOR: '/images/category_section/mon.webp',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=2000&auto=format&fit=crop'

const GRID_STYLES: Record<number, string> = {
    0: 'col-span-12 lg:col-span-6',
    1: 'col-span-12 sm:col-span-6 lg:col-span-3',
    2: 'col-span-12 sm:col-span-6 lg:col-span-3',
    3: 'col-span-12 sm:col-span-6 lg:col-span-4',
    4: 'col-span-12 sm:col-span-6 lg:col-span-4',
    5: 'col-span-12 sm:col-span-6 lg:col-span-4',
    6: 'col-span-12 sm:col-span-6 lg:col-span-4',
}

const CategoryCard = memo(function CategoryCard({
    cat,
    index,
    count,
}: {
    cat: { id: string; label: string; query?: string | null }
    index: number
    count?: number
}) {
    const imageKey = cat.label.toUpperCase().replace(/\s+/g, '_')
    const bgImage = CATEGORY_IMAGES[imageKey] ?? FALLBACK_IMAGE

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className={`${GRID_STYLES[index] ?? 'col-span-12 sm:col-span-6 lg:col-span-4'} group relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950`}
        >
            <Link href={cat.query ? `/products?${cat.query}` : `/products?category=${encodeURIComponent(cat.label)}`} className="absolute inset-0 z-20">
                <span className="sr-only">Shop {cat.label}</span>
            </Link>

            <Image
                src={bgImage}
                alt={cat.label}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                priority={index < 3}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/12 to-transparent" />

            <div className="relative z-10 flex min-h-[250px] flex-col justify-between p-6 sm:min-h-[280px]">
                <div className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {count ? `${count} products` : 'Explore'}
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-3xl text-white sm:text-4xl">{cat.label}</h3>
                            <p className="mt-2 max-w-xs text-sm leading-6 text-white/72">
                                Streamlined discovery for one of the most important parts of the build.
                            </p>
                        </div>
                        <div className="flex size-11 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-300 group-hover:-translate-y-1">
                            <ArrowUpRight className="size-4" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
})

interface Props {
    categories: CategoryHierarchy[]
    productCounts?: Record<string, number>
}

export default function CategorySection({ categories, productCounts }: Props) {
    const cats = useMemo(() => {
        if (!categories?.length) return []

        return categories
            .filter((category) => !category.parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(0, 7)
            .map((category) => ({
                id: category.category?.id || category.id,
                label: category.label,
                query: category.query,
            }))
    }, [categories])

    return (
        <section className="px-3 py-16 sm:px-5 sm:py-20">
            <Container maxWidth="2xl">
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="section-kicker">Shop by purpose</p>
                        <h2 className="mt-3 text-4xl text-slate-950 sm:text-5xl">
                            A catalog that feels edited, not crowded.
                        </h2>
                        <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
                            Clear entry points help customers move from intent to product faster, whether they are replacing one part or planning an entire build.
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                    >
                        Browse full catalog
                        <ArrowUpRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {cats.map((cat, index) => (
                        <CategoryCard
                            key={cat.id}
                            cat={cat}
                            index={index}
                            count={productCounts?.[cat.label]}
                        />
                    ))}
                </div>
            </Container>
        </section>
    )
}
