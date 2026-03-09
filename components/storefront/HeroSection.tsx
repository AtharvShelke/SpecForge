'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const HERO_SLIDES = [
    {
        badge: 'New Arrivals',
        headline: 'Performance',
        highlight: 'Unleashed',
        sub: 'Next-generation RTX 40-series and latest architectures. Push your limits with hardware built for creators and enthusiasts.',
        cta: '/builds/new',
        ctaText: 'Start Building',
        image: '/images/hero.jpg',
    },
    {
        badge: 'Enthusiast Grade',
        headline: 'Master Your',
        highlight: 'Domain',
        sub: 'Curated premium components with guaranteed compatibility. Stop worrying about specs and start gaming.',
        cta: '/products',
        ctaText: 'Explore Hardware',
        image: '/images/hero2.jpg',
    },
    {
        badge: 'Prebuilt Perfection',
        headline: 'Ready to',
        highlight: 'Dominate',
        sub: 'Expertly assembled, rigorously tested, and perfectly tuned. Your new battle station awaits.',
        cta: '/build-guides',
        ctaText: 'View Prebuilts',
        image: '/images/hero3.jpg',
    },
]

export default function HeroSection() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [slideIndex, setSlideIndex] = useState(0)

    useEffect(() => {
        const t = setInterval(() => setSlideIndex(p => (p + 1) % HERO_SLIDES.length), 7000)
        return () => clearInterval(t)
    }, [])

    const slide = HERO_SLIDES[slideIndex]

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        router.push(`/products?q=${encodeURIComponent(query)}`)
    }

    return (
        <section className="relative h-[100vh] min-h-[700px] w-full bg-zinc-950 text-white overflow-hidden flex flex-col justify-center">
            {/* Cinematic Background Images */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={slideIndex}
                        src={slide.image}
                        alt="Background"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="object-cover w-full h-full"
                    />
                </AnimatePresence>

                {/* Vignette & Gradient Overlays for Depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <Container className="relative z-10 flex flex-col justify-between h-full py-12">

                {/* Top Spacer */}
                <div className="flex-1" />

                {/* Main Content Area */}
                <div className="w-full max-w-4xl mx-auto md:mx-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={slideIndex}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                                <Sparkles size={14} className="text-white" />
                                <span className="text-xs font-semibold tracking-widest uppercase text-white/90">{slide.badge}</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
                                {slide.headline}<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                                    {slide.highlight}
                                </span>
                            </h1>

                            <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light drop-shadow-md">
                                {slide.sub}
                            </p>

                            <Link
                                href={slide.cta}
                                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold uppercase tracking-wide
                                overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                <span className="relative z-10">{slide.ctaText}</span>
                                <motion.div
                                    className="relative z-10 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors"
                                >
                                    <ArrowRight size={16} />
                                </motion.div>
                                {/* Button Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white via-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex-1" />

                {/* Bottom Section: Search & Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-3xl mx-auto md:mx-0 mt-auto"
                >
                    <div className="backdrop-blur-xl bg-black/20 p-2 border border-white/10 rounded-2xl md:rounded-full shadow-2xl">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center relative">
                            <div className="w-full flex items-center pl-6">
                                <Search className="text-zinc-400 group-focus-within:text-white transition-colors" size={22} />
                                <input
                                    id="hero-search"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search for RTX 4090, i9-14900K, or prebuilt categories..."
                                    className="w-full h-14 pl-4 pr-6 bg-transparent text-white placeholder:text-zinc-500 font-medium
                                    focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full md:w-auto mt-2 md:mt-0 px-8 h-12 rounded-xl md:rounded-full bg-indigo-600 text-white font-bold tracking-wide hover:bg-indigo-500 transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pl-2 hidden md:flex">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Trending:</span>
                        {['GPUs', 'Processors', 'DDR5 RAM', 'Custom Builds'].map(cat => (
                            <Link
                                key={cat}
                                href={`/products?category=${cat === 'GPUs' ? 'GPU' : cat}`}
                                className="px-4 py-1.5 text-xs font-medium rounded-full border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-8 right-8 hidden xl:flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase rotate-90 mb-6">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="opacity-50"
                    >
                        <ChevronDown size={20} />
                    </motion.div>
                </motion.div>

            </Container>
        </section>
    )
}
