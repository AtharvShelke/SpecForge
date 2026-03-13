'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Eye, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Product } from '@/types'

interface Props {
    products: Product[]
    addToCart: (p: Product) => void
}

function ProductCardPremium({
    product,
    onAddToCart,
    index,
}: {
    product: Product
    onAddToCart: (p: Product) => void
    index: number
}) {
    const price = product.variants?.[0]?.price || 0
    const compareAt = product.variants?.[0]?.compareAtPrice
    const image = product.media?.[0]?.url
    const brand = product.brand?.name
    const hasDiscount = compareAt && compareAt > price
    const discountPct = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0
    const isInStock = product.variants?.[0]?.status !== 'OUT_OF_STOCK'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
            className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-[0_10px_25px_-10px_rgba(0,0,0,0.12)] sm:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border border-zinc-100"
        >
            {/* Top Badges */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {hasDiscount && (
                    <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
                        Save {discountPct}%
                    </div>
                )}
                {index < 3 && (
                    <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-zinc-950 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-1">
                        <TrendingUp size={10} /> Bestseller
                    </div>
                )}
            </div>

            {/* Immersive Image Container */}
            <Link href={`/products/${product.id}`} className="relative bg-zinc-50 aspect-square w-full overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        loading="lazy"
                    />
                ) : (
                    <Eye size={32} className="text-zinc-300" />
                )}

                {/* Floating Action Button (Cart) */}
                {isInStock && (
                    <button
                        onClick={(e) => { e.preventDefault(); onAddToCart(product) }}
                        className="absolute bottom-4 right-4 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-xl 
                        sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-600 hover:scale-105 active:scale-95 z-30"
                        aria-label="Add to cart"
                    >
                        <Plus size={16} strokeWidth={2} />
                    </button>
                )}
            </Link>

            {/* Content Area */}
            <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1">
                {brand && (
                    <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                        {brand}
                    </p>
                )}

                <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-950 line-clamp-2 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto">


                    <div className="flex items-end gap-2">
                        <span className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                            <span className="text-sm font-semibold text-zinc-400 line-through mb-0.5">
                                ₹{compareAt.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function FeaturedProductsSection({ products, addToCart }: Props) {
    if (!products.length) return null

    return (
        <section className="py-14 sm:py-20 md:py-24 bg-white" id="featured-products">
            <Container>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 md:mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter mb-4">
                            Exceptional <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Hardware.</span>
                        </h2>
                        <p className="text-zinc-500 text-sm sm:text-sm sm:text-base md:text-xl font-light">
                            Top-rated components sought after by enthusiasts and professionals.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Link
                            href="/products"
                            className="group mt-6 md:mt-0 inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-900 pb-1 hover:text-red-500 hover:border-red-500 transition-colors"
                        >
                            View Entire Catalog
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {products.map((product, i) => (
                        <ProductCardPremium
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            index={i}
                        />
                    ))}
                </div>
            </Container>
        </section>
    )
}
