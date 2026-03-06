'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'

export default function CtaBanner() {
    return (
        <section className="relative py-32 overflow-hidden bg-zinc-950 border-t border-white/5">
            {/* Background Image / Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=2064&auto=format&fit=crop"
                    alt="Abstract Technical Background"
                    className="w-full h-full object-cover opacity-20 filter grayscale blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-indigo-950/40 mix-blend-multiply" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 blur-[200px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-8">
                        <Zap size={16} className="text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Next Generation</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
                        Elevate Your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
                            Digital Experience.
                        </span>
                    </h2>

                    <p className="text-zinc-400 text-lg md:text-xl font-light max-w-2xl mx-auto mb-12">
                        Whether you are pushing frames in the latest AAA titles or compiling massive codebases, equip yourself with hardware designed for the absolute pinnacle of performance.
                    </p>

                    <Link
                        href="/products"
                        className="group inline-flex items-center gap-4 bg-white text-zinc-950 px-10 py-5 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                    >
                        Explore the Foundry
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
