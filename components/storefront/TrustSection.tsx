'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Truck, Clock, Wrench } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const TRUST_METRICS = [
    {
        icon: ShieldCheck,
        title: 'Guaranteed Authentic',
        desc: 'Every component is sourced directly from authorized manufacturers.',
        stat: '100%',
        statLabel: 'Genuine'
    },
    {
        icon: Truck,
        title: 'Express Fulfillment',
        desc: 'Orders processed within 24 hours. Premium insured shipping worldwide.',
        stat: '24h',
        statLabel: 'Dispatch'
    },
    {
        icon: Wrench,
        title: 'Expert Assembly',
        desc: 'Custom loops and intricate builds crafted by veteran technicians.',
        stat: '5yr+',
        statLabel: 'Tech Exp'
    },
    {
        icon: Clock,
        title: 'Priority Support',
        desc: 'Direct access to hardware specialists 24/7 for troubleshooting.',
        stat: '24/7',
        statLabel: 'Support'
    },
]

export default function TrustSection() {
    return (
        <section className="py-24 bg-zinc-950 border-t border-white/5 relative overflow-hidden" id="trust">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

            <Container className="relative z-10">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-xl"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">
                            Uncompromising <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Excellence.</span>
                        </h2>
                        <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
                            We don't just sell components; we engineer experiences. Our commitment to quality ensures your hardware performs at its absolute peak, from the moment it leaves our facility to years of relentless rendering and gaming.
                        </p>
                    </motion.div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TRUST_METRICS.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="group relative p-8 rounded-3xl bg-zinc-900 overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-colors duration-500"
                        >
                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <item.icon size={24} className="text-indigo-400" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{item.statLabel}</p>
                                        <p className="text-3xl font-black text-white">{item.stat}</p>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    )
}
