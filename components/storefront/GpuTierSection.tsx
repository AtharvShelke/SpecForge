'use client'

import { useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { useShop } from '@/context/ShopContext'
import { filterGpuTier } from '@/services/filterGpuTier'
import { Product } from '@/types'

// ── Animation variants (defined once at module scope, never recreated) ────────

const cardWrapVariants = {
    hidden:  { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0  },
}

const headerLeftVariants = {
    hidden:  { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0   },
}

const headerRightVariants = {
    hidden:  { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0  },
}

const imgHoverVariants = {
    hover: { scale: 1.05 },
    tap:   { scale: 0.98 },
}

const imgTransition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }

const VIEWPORT_ONCE       = { once: true } as const
const VIEWPORT_ONCE_MARGIN = { once: true, margin: '-50px' } as const

// ── GpuPremiumCard ────────────────────────────────────────────────────────────

const GpuPremiumCard = memo(function GpuPremiumCard({
    product,
    addToCart,
    priority,
}: {
    product:   Product
    addToCart: (p: Product) => void
    priority:  boolean
}) {
    const price = product.variants?.[0]?.price ?? 0
    const image = product.media?.[0]?.url
    const brand = product.brand?.name

    const handleAddToCart = useCallback(
        () => addToCart(product),
        [addToCart, product]
    )

    return (
        <div className="group relative w-[72vw] sm:w-[280px] md:w-[360px]w-[85vw] md:w-[360px] flex-shrink-0 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden hover:bg-zinc-800/80 transition-all duration-500">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <Link href={`/products/${product.id}`} className="block relative aspect-[4/3] p-3 sm:p-4 md:p-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10 opacity-80" />
                {image ? (
                    <motion.img
                        src={image}
                        alt={product.name}
                        width={360}
                        height={270}
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        decoding="async"
                        variants={imgHoverVariants}
                        whileHover="hover"
                        whileTap="tap"
                        transition={imgTransition}
                        className="w-full h-full object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] z-0"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800 rounded-xl z-0">
                        No Image
                    </div>
                )}

                {brand && (
                    <div className="absolute top-4 left-4 z-20 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] bg-white/10 backdrop-blur-md rounded-full font-semibold tracking-widest uppercase text-white border border-white/20">
                        {brand}
                    </div>
                )}
            </Link>

            <div className="p-3 sm:p-4 md:p-6 pt-0 relative z-20">
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white line-clamp-2 leading-tight mb-3 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                <div className="flex flex-col gap-4 mt-auto">
                    <div>
                        <span className="block text-[9px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-1">Starting At</span>
                        <span className="text-xl sm:text-2xl font-black text-white">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-full h-9 sm:h-10 md:h-12 bg-white text-zinc-950 rounded-xl flex items-center justify-center gap-2 font-semibold uppercase tracking-wide hover:bg-indigo-500 hover:text-white active:scale-[0.98] transition-all duration-300"
                    >
                        <ShoppingBag size={16} />
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    )
})

// ── GpuTierSection ────────────────────────────────────────────────────────────

export default function GpuTierSection() {
    const { products, addToCart } = useShop()
    const { scrollYProgress } = useScroll()

    // useTransform is already memoised internally by framer-motion
    const yTransform = useTransform(scrollYProgress, [0, 1], [100, -100])

    const enthusiastGpus = useMemo(
        () => filterGpuTier(products, 'ENTHUSIAST').slice(0, 6),
        [products]
    )

    const hasGpus = useMemo(
        () => products.some(p => p.category === 'GPU'),
        [products]
    )

    if (!hasGpus) return null

    return (
        <section className="relative py-10 sm:py-20 md:py-24 bg-zinc-950 overflow-hidden" id="gpu-showcase">
            {/* Cinematic background blobs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] md:w-[800px] md:h-[800px] bg-indigo-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-violet-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none -translate-x-1/3 translate-y-1/3" />

            <Container className="relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 md:gap-12 lg:items-end justify-between mb-8 sm:mb-12 md:mb-16">
                    <motion.div
                        variants={headerLeftVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="max-w-xl"
                    >
                        <h2 className="text-[9px] sm:text-[11px] sm:text-sm font-semibold tracking-[0.2em] text-indigo-500 uppercase mb-4">Ultimate Performance</h2>
                        <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-6">
                            Next-Gen <br /> Graphics.
                        </h3>
                        <p className="text-zinc-400 text-[9px] sm:text-[11px] sm:text-sm sm:text-base md:text-lg leading-relaxed font-light">
                            Experience photorealistic ray tracing and AI-powered frame generation.
                            The enthusiast tier features the pinnacle of consumer graphics architecture.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={headerRightVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Link
                            href="/products?category=Graphics%20Card"
                            className="group inline-flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-full border border-white/20 text-white font-semibold tracking-wide hover:bg-white hover:text-zinc-950 transition-all duration-300"
                        >
                            View All GPUs
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Horizontal scrollable carousel */}
                <div className="relative -mx-3 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8">
                    <div
                        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory hide-scrollbar hide-scrollbar-css relative z-20"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {enthusiastGpus.map((gpu, i) => (
                            <motion.div
                                key={gpu.id}
                                className="snap-start"
                                variants={cardWrapVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={VIEWPORT_ONCE_MARGIN}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                            >
                                <GpuPremiumCard
                                    product={gpu}
                                    addToCart={addToCart}
                                    priority={i === 0}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Container>

            <style>{`.hide-scrollbar-css::-webkit-scrollbar { display: none; }`}</style>
        </section>
    )
}