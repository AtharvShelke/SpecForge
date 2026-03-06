'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Settings2, CheckCircle2, Zap, Shield, ArrowRight, Layers, Box, ZapIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const FEATURES = [
    {
        icon: CheckCircle2,
        title: 'Intelligent Validation',
        desc: 'Our engine cross-references socket types, form factors, and power draws instantly.',
    },
    {
        icon: ZapIcon,
        title: 'Live Market Pricing',
        desc: 'Dynamic cart updates with exact costs based on real-time inventory.',
    },
    {
        icon: Shield,
        title: 'Guaranteed Fit',
        desc: 'If our system says it works, we guarantee it fits or we replace it.',
    },
]

export default function CustomBuilderSection() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] })

    const y1 = useTransform(scrollYProgress, [0, 1], [100, -100])
    const y2 = useTransform(scrollYProgress, [0, 1], [200, -200])

    return (
        <section ref={containerRef} className="relative py-32 overflow-hidden bg-zinc-50" id="custom-builder">

            <Container className="relative z-10">
                <div className="bg-zinc-950 rounded-[40px] overflow-hidden relative shadow-2xl">

                    {/* Inner abstract background elements */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-indigo-600/20 to-transparent" />
                        <motion.div
                            style={{ y: y1 }}
                            className="absolute -top-64 -right-64 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full"
                        />
                        <motion.div
                            style={{ y: y2 }}
                            className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full"
                        />
                    </div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
                    />

                    <div className="grid lg:grid-cols-2 relative z-10">
                        {/* Left: Content */}
                        <div className="p-10 md:p-16 lg:p-20 flex flex-col justify-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
                                    <Settings2 size={16} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">System Architect</span>
                                </div>

                                <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                                    Forge Your<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
                                        Masterpiece.
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-12 font-light">
                                    Select premium components while our intelligent engine handles compatibility, power calculations, and clearance checks in real time.
                                </p>

                                {/* Feature grid */}
                                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                                    {FEATURES.slice(0, 2).map((feat, i) => (
                                        <div key={i} className="flex flex-col gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <feat.icon size={20} className="text-indigo-400" />
                                            </div>
                                            <h4 className="text-white font-bold">{feat.title}</h4>
                                            <p className="text-zinc-500 text-sm">{feat.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <Link
                                        href="/builds/create"
                                        className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold uppercase tracking-wide
                                        hover:scale-105 active:scale-95 transition-all duration-300"
                                    >
                                        Enter Builder
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Immersive App Preview */}
                        <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden">
                            <motion.div
                                style={{ y: y1 }}
                                className="relative w-full max-w-md"
                            >
                                {/* Floating Glass UI Elements */}
                                <motion.div
                                    className="absolute -right-12 -top-12 z-20 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="text-emerald-400" size={18} />
                                        <span className="text-white font-bold text-sm">Compatible</span>
                                    </div>
                                    <p className="text-zinc-400 text-xs">Socket AM5 & DDR5 Validated</p>
                                </motion.div>

                                <motion.div
                                    className="absolute -left-12 bottom-12 z-20 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                                    animate={{ y: [0, 15, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                >
                                    <div className="flex items-center justify-between gap-6 mb-1">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider">Est. Power</span>
                                        <span className="text-amber-400 font-bold text-sm">645W</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2">
                                        <div className="bg-gradient-to-r from-emerald-400 to-amber-400 h-1.5 rounded-full w-2/3" />
                                    </div>
                                </motion.div>

                                {/* Main UI Mockup */}
                                <div className="bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-10 w-full aspect-[4/5] flex flex-col">
                                    <div className="h-12 border-b border-white/10 flex items-center px-6 gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col gap-4">
                                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-white/20 rounded w-1/2" />
                                                <div className="h-2 bg-white/10 rounded w-1/3" />
                                            </div>
                                        </div>
                                        <div className="h-20 bg-white/5 rounded-2xl border border-indigo-500/30 p-4 flex items-center gap-4 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-indigo-500/10" />
                                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center relative z-10">
                                                <Layers size={20} className="text-indigo-400" />
                                            </div>
                                            <div className="flex-1 space-y-2 relative z-10">
                                                <div className="h-3 bg-white hover:bg-white/90 rounded w-2/3 transition-colors" />
                                                <div className="h-2 bg-indigo-200/50 rounded w-1/4" />
                                            </div>
                                        </div>
                                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-white/20 rounded w-3/4" />
                                                <div className="h-2 bg-white/10 rounded w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-white/10 bg-white/5">
                                        <div className="h-10 bg-indigo-600 rounded-xl w-full" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
