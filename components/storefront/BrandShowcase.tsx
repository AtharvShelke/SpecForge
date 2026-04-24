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

    const loopedBrands = [...brands, ...brands, ...brands].slice(0, 24)

    return (
        <section className="px-3 py-12 sm:px-5 sm:py-16">
            <Container maxWidth="2xl">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 px-6 py-8 text-white shadow-[0_32px_80px_-56px_rgba(15,23,42,0.7)] sm:px-8">
                    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/50">
                                Trusted brands
                            </p>
                            <h2 className="mt-3 text-4xl sm:text-5xl">
                                Hardware people already know by name.
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-white/68 sm:text-base">
                            Premium UI should still make trust obvious. Familiar brands, visible at a glance, reduce friction before customers even open a product page.
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/5 py-5">
                        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 to-transparent" />
                        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 to-transparent" />
                        <motion.div
                            className="flex w-max shrink-0 items-center"
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ repeat: Infinity, ease: 'linear', duration: 26 }}
                        >
                            {loopedBrands.map((brand, index) => (
                                <Link
                                    href={`/products?brand=${encodeURIComponent(brand.name)}`}
                                    key={`${brand.id}-${index}`}
                                    className="px-6 py-3 text-lg font-semibold tracking-[-0.03em] text-white/58 transition-colors duration-300 hover:text-white sm:px-10 sm:text-2xl"
                                >
                                    {brand.name}
                                </Link>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
