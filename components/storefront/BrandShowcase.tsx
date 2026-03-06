'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Container } from '@/components/layout/Container'
import { Brand } from '@/types'

interface Props {
    brands: Brand[]
}

export default function BrandShowcase({ brands }: Props) {
    if (!brands?.length) return null

    // For infinite scroll, double the brands so there is no gap
    const loopedBrands = [...brands, ...brands, ...brands, ...brands].slice(0, 30)

    return (
        <section className="py-20 bg-zinc-950 border-t border-white/5 overflow-hidden flex flex-col items-center justify-center" id="brands">
            <Container className="mb-12">
                <div className="text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] relative inline-block">
                        <span className="absolute -left-12 top-1/2 w-8 h-[1px] bg-zinc-700"></span>
                        Powering Our Arsenal
                        <span className="absolute -right-12 top-1/2 w-8 h-[1px] bg-zinc-700"></span>
                    </p>
                </div>
            </Container>

            <div className="relative w-full flex overflow-hidden group">
                {/* Gradient Masks for fading effect */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

                <motion.div
                    className="flex shrink-0 w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40,
                    }}
                >
                    {loopedBrands.map((brand, i) => (
                        <Link
                            href={`/products?brand=${encodeURIComponent(brand.name)}`}
                            key={i}
                            className="flex items-center justify-center px-12 py-6 filter grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                        >
                            <span className="text-2xl md:text-4xl font-black text-white/80 lowercase tracking-tighter mix-blend-plus-lighter drop-shadow-xl select-none">
                                {brand.name}
                            </span>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
