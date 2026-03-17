'use client'

import Link from 'next/link'
import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Cpu, MonitorSpeaker, MemoryStick, HardDrive, ArrowRight, Zap, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { calculateBuildPrice } from '@/services/buildPrice'

// ── Constants (module scope — never recreated) ────────────────────────────────

const COMPONENT_ICONS: Record<string, React.ElementType> = {
    PROCESSOR: Cpu,
    GPU:       MonitorSpeaker,
    RAM:       MemoryStick,
    STORAGE:   HardDrive,
}

const BUILD_BGS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop',
] as const

const COMPONENTS = ['PROCESSOR', 'GPU', 'RAM', 'STORAGE'] as const

// ── Animation variants (module scope — stable references, never recreated) ────

const cardVariants = {
    hidden:  { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0  },
}

const headerVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0  },
}

const fadeVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
}

const VIEWPORT_ONCE        = { once: true } as const
const VIEWPORT_ONCE_MARGIN = { once: true, margin: '-50px' } as const

const cardEase = [0.22, 1, 0.36, 1] as const

// ── BuildCardCinematic ────────────────────────────────────────────────────────

const BuildCardCinematic = memo(function BuildCardCinematic({
    build,
    index,
}: {
    build:  any
    index:  number
}) {
    const total   = calculateBuildPrice(build.items)
    const bgImage = BUILD_BGS[index % BUILD_BGS.length]

    const getComponent = useCallback(
        (cat: string) => build.items.find((i: any) => i.variant.product.category === cat),
        [build.items]
    )

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE_MARGIN}
            transition={{ delay: index * 0.1, duration: 0.6, ease: cardEase }}
            className="group relative flex flex-col h-[360px] sm:h-[420px] md:h-[500px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer"
        >
            <Link href={`/builds/${build.id}`} className="absolute inset-0 z-20">
                <span className="sr-only">View {build.title}</span>
            </Link>

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Build Background"
                    width={800}
                    height={500}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/20 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay" />
            </div>

            {/* Glowing border */}
            <div className="absolute inset-0 z-10 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-3xl group-hover:border-indigo-500/50 transition-colors duration-500 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full p-3 sm:p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-auto">
                    <div className="inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-widest">Optimized</span>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:bg-indigo-600 transition-colors duration-300">
                        <ArrowUpRight size={14} />
                    </div>
                </div>

                {/* Content */}
                <div className="mt-8 transform sm:group-hover:-translate-y-2 transition-transform duration-500">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight mb-2">
                        {build.title}
                    </h3>
                    {build.description && (
                        <p className="text-zinc-400 text-sm line-clamp-2 mb-4 sm:mb-6 font-light">
                            {build.description}
                        </p>
                    )}

                    {/* Specs list */}
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                        {COMPONENTS.map(cat => {
                            const comp = getComponent(cat)
                            const Icon = COMPONENT_ICONS[cat] ?? Cpu
                            if (!comp) return null
                            return (
                                <div key={cat} className="flex items-center gap-2">
                                    <Icon size={14} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                                    <p className="text-[11px] sm:text-xs font-medium text-zinc-300 truncate">
                                        {comp.variant.product.name}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer / Price */}
                    <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                        <div>
                            <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Build Cost</p>
                            <p className="text-lg sm:text-xl md:text-2xl font-black text-white">
                                ₹{total.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
})

// ── FeaturedBuildsSection ─────────────────────────────────────────────────────

export default function FeaturedBuildsSection({ builds }: { builds: any[] }) {
    if (!builds?.length) return null

    return (
        <section className="py-10 sm:py-20 md:py-24 bg-zinc-950 px-3 sm:px-4 md:px-0" id="featured-builds">
            <Container>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 md:mb-16">
                    <motion.div
                        variants={headerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <h2 className="text-lg sm:text-xl md:text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                            Mastercrafted <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Systems.</span>
                        </h2>
                        <p className="text-zinc-400 text-sm sm:text-base md:text-xl font-light">
                            Pre-configured perfection. We've taken the guesswork out of building with these expertly balanced, ready-to-order machines.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT_ONCE}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href="/build-guides"
                            className="group mt-6 md:mt-0 inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg sm:rounded-full font-semibold border border-white/20 text-sm text-white uppercase tracking-wider hover:bg-white hover:text-zinc-950 transition-all duration-300"
                        >
                            View All Builds
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Build grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {builds.map((build: any, i: number) => {
                        const isLarge = i === 0
                        return (
                            <div key={build.id} className={isLarge ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'}>
                                <BuildCardCinematic build={build} index={i} />
                            </div>
                        )
                    })}
                </div>
            </Container>
        </section>
    )
}