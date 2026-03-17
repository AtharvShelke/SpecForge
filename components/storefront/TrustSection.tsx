'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Truck, Clock, Wrench } from 'lucide-react'
import { Container } from '@/components/layout/Container'

// ── Constants (module scope — never recreated) ────────────────────────────────

const TRUST_METRICS = [
    {
        icon: ShieldCheck,
        title: 'Guaranteed Authentic',
        desc: 'Every component is sourced directly from authorized manufacturers.',
        stat: '100%',
        statLabel: 'Genuine',
    },
    {
        icon: Truck,
        title: 'Express Fulfillment',
        desc: 'Orders processed within 24 hours. Premium insured shipping worldwide.',
        stat: '24h',
        statLabel: 'Dispatch',
    },
    {
        icon: Wrench,
        title: 'Expert Assembly',
        desc: 'Custom loops and intricate builds crafted by veteran technicians.',
        stat: '5yr+',
        statLabel: 'Tech Exp',
    },
    {
        icon: Clock,
        title: 'Priority Support',
        desc: 'Direct access to hardware specialists 24/7 for troubleshooting.',
        stat: '24/7',
        statLabel: 'Support',
    },
] as const

// ── Animation variants (module scope — stable references) ─────────────────────

const headerVariants = {
    hidden:  { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0   },
}

const cardVariants = {
    hidden:  { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0  },
}

const VIEWPORT_ONCE = { once: true } as const

const cardEase = [0.22, 1, 0.36, 1] as const

// ── TrustCard ─────────────────────────────────────────────────────────────────

const TrustCard = memo(function TrustCard({
    item,
    index,
}: {
    item:  typeof TRUST_METRICS[number]
    index: number
}) {
    const Icon = item.icon

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            transition={{ delay: index * 0.1, duration: 0.6, ease: cardEase }}
            className="group relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl bg-zinc-900 overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-colors duration-500"
        >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 sm:from-indigo-600/10 to-cyan-600/5 sm:to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 sm:mb-8 md:mb-12">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center">
                        <Icon size={18} className="text-indigo-400" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">{item.statLabel}</p>
                        <p className="text-xs sm:text-sm md:text-base font-black text-white">{item.stat}</p>
                    </div>
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white mb-3">
                    {item.title}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed">
                    {item.desc}
                </p>
            </div>
        </motion.div>
    )
})

// ── TrustSection ──────────────────────────────────────────────────────────────

export default function TrustSection() {
    return (
        <section
            className="py-10 sm:py-20 md:py-24 bg-zinc-950 border-t border-white/5 relative overflow-hidden"
            id="trust"
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] blur-[100px] sm:blur-[150px] bg-indigo-500/5 rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] blur-[100px] sm:blur-[150px] bg-cyan-500/5 rounded-full mix-blend-screen pointer-events-none" />

            <Container className="relative z-10">
                <div className="flex flex-col md:flex-row gap-6 sm:gap-10 lg:gap-24 mb-8 sm:mb-12 md:mb-16">
                    <motion.div
                        variants={headerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.6 }}
                        className="max-w-xl"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter mb-4 sm:mb-6">
                            Uncompromising <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Excellence.</span>
                        </h2>
                        <p className="text-zinc-400 text-sm sm:text-base md:text-xl lg:text-2xl font-light leading-relaxed">
                            We don't just sell components; we engineer experiences. Our commitment to quality ensures your hardware performs at its absolute peak, from the moment it leaves our facility to years of relentless rendering and gaming.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {TRUST_METRICS.map((item, i) => (
                        <TrustCard key={item.title} item={item} index={i} />
                    ))}
                </div>
            </Container>
        </section>
    )
}