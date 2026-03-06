import Link from 'next/link'
import { ShoppingBag, Star, Eye } from 'lucide-react'
import { Product } from '@/types'

interface Props {
    product: Product
    rating?: { average: number; count: number }
    onAddToCart: (p: Product) => void
}

export default function ProductCard({ product, rating, onAddToCart }: Props) {
    const price = product.variants?.[0]?.price || 0
    const compareAt = product.variants?.[0]?.compareAtPrice
    const image = product.media?.[0]?.url
    const brand = product.brand?.name
    const hasDiscount = compareAt && compareAt > price
    const discountPct = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0

    return (
        <div className="group bg-white border border-zinc-100 rounded-2xl overflow-hidden
                    hover:shadow-lg hover:border-zinc-200 transition-all duration-300">

            {/* Image */}
            <Link href={`/products/${product.id}`}>
                <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                    {hasDiscount && (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-md">
                            -{discountPct}%
                        </span>
                    )}

                    {image ? (
                        <img
                            src={image}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={product.name}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-200">
                            <Eye size={28} />
                        </div>
                    )}

                    {/* Quick view overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-2 left-2 right-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm
                               text-zinc-900 rounded-lg text-[11px] font-medium">
                                <Eye size={12} /> Quick View
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="p-3.5">
                {/* Brand */}
                {brand && (
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
                        {brand}
                    </p>
                )}

                {/* Name */}
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug mb-1.5
                         group-hover:text-zinc-700 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                {rating && rating.count > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                size={11}
                                className={i <= Math.round(rating.average)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-zinc-200"}
                            />
                        ))}
                        <span className="text-[10px] text-zinc-400 ml-0.5">({rating.count})</span>
                    </div>
                )}

                {/* Price + Cart */}
                <div className="flex items-center justify-between">
                    <div>
                        {hasDiscount && (
                            <span className="text-[11px] text-zinc-400 line-through mr-1.5">
                                ₹{compareAt.toLocaleString('en-IN')}
                            </span>
                        )}
                        <span className="font-bold text-zinc-900">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <button
                        onClick={() => onAddToCart(product)}
                        className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center
                       hover:bg-zinc-800 active:scale-95 transition-all duration-200"
                        aria-label="Add to cart"
                    >
                        <ShoppingBag size={13} />
                    </button>
                </div>
            </div>
        </div>
    )
}