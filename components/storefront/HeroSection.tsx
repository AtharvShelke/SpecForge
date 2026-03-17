'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowRight, Sparkles, ChevronDown, Gamepad2, Video, Cpu } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const HERO_SLIDES = [
    {
        badge: 'Built for Gamers',
        icon: Gamepad2,
        headline: 'Win Every',
        highlight: 'Match',
        sub: 'High-refresh builds with RTX 40-series GPUs. 4K, 240Hz, zero compromises — made for long sessions.',
        cta: '/builds/gaming',
        ctaText: 'Build My Gaming PC',
        image: '/images/red-pc.jpg',
        accentColor: 'from-red-500 via-orange-400 to-red-600',
        accentGlow: 'rgba(239,68,68,0.35)',
        badgeBg: 'bg-red-500/20 border-red-500/30',
        badgeText: 'text-red-300',
        ctaClass: 'bg-white text-zinc-950 hover:bg-zinc-100',
        sideLabel: 'Gaming',
        sideLabelColor: 'text-red-400',
        stats: [
            { value: '240Hz', label: 'Max Refresh' },
            { value: '4K', label: 'Ready' },
            { value: '<1ms', label: 'Latency' },
        ],
    },

    {
        badge: 'Creator Ready',
        icon: Video,
        headline: 'Create Without',
        highlight: 'Lag',
        sub: 'Smooth timelines, fast renders, instant previews. Built for Premiere, After Effects, Blender and DaVinci.',
        cta: '/builds/editing',
        ctaText: 'Build My Creator PC',
        image: '/images/white-pc.jpg',
        accentColor: 'from-blue-400 via-cyan-300 to-indigo-500',
        accentGlow: 'rgba(99,102,241,0.35)',
        badgeBg: 'bg-indigo-500/20 border-indigo-500/30',
        badgeText: 'text-indigo-300',
        ctaClass: 'bg-white text-zinc-950 hover:bg-zinc-100',
        sideLabel: 'Creator',
        sideLabelColor: 'text-indigo-400',
        stats: [
            { value: '8K', label: 'Editing' },
            { value: '192GB', label: 'Max RAM' },
            { value: 'NVMe', label: 'Speed' },
        ],
    },

    {
        badge: 'Workstation Grade',
        icon: Cpu,
        headline: 'Power Without',
        highlight: 'Limits',
        sub: 'Run simulations, AI workloads and heavy projects without slowdowns. Built for professionals.',
        cta: '/builds/workstation',
        ctaText: 'Build My Workstation',
        image: '/images/green-pc.jpg',
        accentColor: 'from-emerald-400 via-teal-300 to-green-500',
        accentGlow: 'rgba(16,185,129,0.3)',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
        badgeText: 'text-emerald-300',
        ctaClass: 'bg-white text-zinc-950 hover:bg-zinc-100',
        sideLabel: 'Workstation',
        sideLabelColor: 'text-emerald-400',
        stats: [
            { value: '128C', label: 'Threads' },
            { value: 'ECC', label: 'Memory' },
            { value: 'HEDT', label: 'Platform' },
        ],
    },
]

export default function HeroSection() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [slideIndex, setSlideIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    useEffect(() => {
        const t = setInterval(() => {
            setIsTransitioning(true)
            setTimeout(() => {
                setSlideIndex(p => (p + 1) % HERO_SLIDES.length)
                setIsTransitioning(false)
            }, 300)
        }, 7000)
        return () => clearInterval(t)
    }, [])

    const slide = HERO_SLIDES[slideIndex]
    const SlideIcon = slide.icon

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        router.push(`/products?q=${encodeURIComponent(query)}`)
    }

    const goToSlide = (idx: number) => {
        if (idx === slideIndex) return
        setIsTransitioning(true)
        setTimeout(() => {
            setSlideIndex(idx)
            setIsTransitioning(false)
        }, 300)
    }

    return (
        <section className="relative mt-[5vh] sm:mt-[6vh] h-[95vh] sm:h-[95vh]  w-full bg-zinc-950 text-white overflow-hidden flex flex-col justify-center">

            {/* ── Ambient Glow from accent color ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`glow-${slideIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse 60% 60% at 80% 50%, ${slide.accentGlow}, transparent 70%)`
                    }}
                />
            </AnimatePresence>

            {/* ── Split layout: right half is the image ── */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`img-${slideIndex}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-0 w-full sm:w-[65%] md:w-[55%] h-full opacity-60 sm:opacity-100"
                    >
                        <img
                            src={slide.image}
                            alt={slide.sideLabel}
                            className="w-full h-full object-cover"
                        />
                        {/* Blend the image into the dark left side */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Left-side solid bleed so text is always readable */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-[60%]" />
            </div>

            {/* ── Subtle noise texture overlay ── */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
            />

            <Container className="relative z-10 flex flex-col justify-between h-[75vh] py-8 sm:py-12 px-2.5 py-1 sm:px-3 sm:px-0">

                <div className="flex-[0.2] sm:flex-1" />

                {/* ── Main Split Content ── */}
                <div className="w-full max-w-xl sm:max-w-2xl h-auto sm:h-[420px] flex items-start">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${slideIndex}`}
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Badge */}
                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md border mb-3 sm:mb-5 ${slide.badgeBg}`}>
                                <SlideIcon size={11} className={slide.badgeText} />
                                <span className={`text-xs font-semibold tracking-widest uppercase ${slide.badgeText}`}>
                                    {slide.badge}
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight sm:tracking-tighter leading-[1] sm:leading-[0.9] mb-3 sm:mb-5 drop-shadow-2xl">
                                {slide.headline}<br />
                                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.accentColor}`}>
                                    {slide.highlight}
                                </span>
                            </h1>

                            {/* Sub */}
                            <p className="text-zinc-300 text-sm sm:text-base md:text-lg max-w-md sm:max-w-xl mb-5 sm:mb-8 leading-relaxed font-light line-clamp-3">
                                {slide.sub}
                            </p>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-9">
                                {slide.stats.map((s, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className={`text-lg sm:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${slide.accentColor}`}>
                                            {s.value}
                                        </span>
                                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>


                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex-[0.3] sm:flex-1" />

                {/* ── Bottom: Search + Slide Dots ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-3xl mt-4 sm:mt-auto"
                >
                    {/* CTA moved here to prevent overlap */}
                    <div className="mb-6">
                        <Link
                            href={slide.cta}
                            className="inline-flex items-center gap-3 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white text-zinc-950 font-semibold uppercase tracking-wide text-xs sm:text-sm hover:bg-zinc-200 transition"
                        >
                            {slide.ctaText}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    {/* Search bar */}
                    <div className="backdrop-blur-xl bg-black/30 p-1.5 sm:p-2 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-full shadow-2xl">
                        <form
                            onSubmit={handleSearch}
                            className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 relative"
                        >
                            <div className="w-full flex items-center pl-3 sm:pl-5">
                                <Search className="text-zinc-400 h-3.5 w-3.5 sm:h-5 sm:w-5" />

                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search parts, builds..."
                                    className="
                    w-full
                    h-9 sm:h-12
                    pl-2 sm:pl-4
                    pr-3 sm:pr-6
                    bg-transparent
                    text-sm sm:text-base
                    text-white
                    placeholder:text-zinc-500
                    font-medium
                    focus:outline-none
                "
                                />
                            </div>

                            <button
                                type="submit"
                                className="
                w-full sm:w-auto
                h-9 sm:h-12
                px-4 sm:px-7
                rounded-lg sm:rounded-full
                bg-indigo-600
                text-white
                text-xs sm:text-sm
                font-semibold
                tracking-wide
                hover:bg-indigo-500
                transition-colors
            "
                            >
                                Search
                            </button>
                        </form>
                    </div>
                    {/* Trending + Slide selector */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pl-2">
                        <div className="hidden md:flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Trending:</span>
                            {['GPUs', 'Processors', 'DDR5 RAM', 'Custom Builds'].map(cat => (
                                <Link
                                    key={cat}
                                    href={`/products?category=${cat === 'GPUs' ? 'GPU' : cat}`}
                                    className="px-4 sm:py-1.5 text-xs font-medium rounded-full border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>

                        {/* Slide indicators with labels */}
                        <div className="flex items-center gap-3">
                            {HERO_SLIDES.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(i)}
                                    className="flex items-center gap-2 group"
                                    aria-label={s.sideLabel}
                                >
                                    <motion.div
                                        className="h-[2px] rounded-full bg-white transition-all duration-500"
                                        animate={{ width: i === slideIndex ? 32 : 12, opacity: i === slideIndex ? 1 : 0.3 }}
                                    />
                                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hidden md:block ${i === slideIndex ? s.sideLabelColor : 'text-zinc-600 group-hover:text-zinc-400'
                                        }`}>
                                        {s.sideLabel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Scroll indicator (centered) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-0 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
                >
                    <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
                        Scroll
                    </span>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut",
                        }}
                        className="text-zinc-400"
                    >
                        <ChevronDown size={22} />
                    </motion.div>
                </motion.div>

            </Container>
        </section>
    )
}