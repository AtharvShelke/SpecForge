'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowRight, ChevronDown, Gamepad2, Video, Cpu } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { HERO_SLIDES } from '@/data/constants'

// ── Constants ────────────────────────────────────────────────────────────────
const SLIDE_DURATION = 5000

// ── Animation variants (defined once, outside component) ─────────────────────
const glowVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
}

const imageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
}

const contentVariants = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
}

const imageTrans = { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }
const contentTrans = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [slideIndex, setSlideIndex] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Starts (or restarts) the auto-advance timer
    const startTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            setSlideIndex(p => (p + 1) % HERO_SLIDES.length)
        }, SLIDE_DURATION)
    }, [])

    useEffect(() => {
        startTimer()
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [startTimer])

    const goToSlide = useCallback((idx: number) => {
        setSlideIndex(idx)
        startTimer() // reset timer so dot-click never double-advances
    }, [startTimer])

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        const q = query.trim()
        if (!q) return
        router.push(`/products?q=${encodeURIComponent(q)}`)
    }, [query, router])

    const slide = HERO_SLIDES[slideIndex]
    const SlideIcon = slide.icon

    return (
        <section className="relative h-[95vh] w-full bg-zinc-950 text-white overflow-hidden flex flex-col justify-center">

            {/* ── Ambient glow ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`glow-${slideIndex}`}
                    variants={glowVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse 60% 60% at 80% 50%, ${slide.accentGlow}, transparent 70%)`
                    }}
                />
            </AnimatePresence>

            {/* ── Hero image (right half) ── */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`img-${slideIndex}`}
                        variants={imageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={imageTrans}
                        className="absolute right-0 top-0 w-full sm:w-[65%] md:w-[55%] h-full opacity-60 sm:opacity-100"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={slide.image}
                            alt={slide.sideLabel}
                            width={1200}
                            height={900}
                            className="w-full h-full object-cover"
                            fetchPriority={slideIndex === 0 ? 'high' : 'low'}
                            loading={slideIndex === 0 ? 'eager' : 'lazy'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Left bleed — keeps text readable on all viewports */}
                <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            </div>

            {/* ── Noise texture ── */}
            <div
                aria-hidden="true"
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }}
            />

            <Container className="relative z-10 flex flex-col justify-between h-[95vh] sm:h-[90vh] lg:h-[92vh] pt-50 pb-50 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24 sm:px-0">

                {/* ══════════ TOP CONTENT BLOCK ══════════ */}
                <div className="relative w-full max-w-lg sm:max-w-xl lg:max-w-lg xl:max-w-xl flex flex-col gap-4 sm:gap-5 lg:gap-4">

                    {/* ── Trending + Slide dots ── */}
                    <div className="flex flex-col items-start justify-between gap-5">
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                                Trending:
                            </span>
                            {['GPUs', 'Processors', 'DDR5 RAM', 'Custom Builds'].map(cat => (
                                <Link
                                    key={cat}
                                    href={cat === 'Custom Builds' ? '/builds/new' : `/products?category=${cat === 'GPUs' ? 'Graphics Card' : cat === 'Processors' ? 'Processor' : 'RAM'}`}
                                    className="px-3 py-1 text-[10px] rounded-full border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            {HERO_SLIDES.map((s, i) => (
                                <button
                                    key={s.sideLabel}
                                    onClick={() => goToSlide(i)}
                                    className="flex items-center gap-2 group"
                                    aria-label={`Go to ${s.sideLabel} slide`}
                                >
                                    <motion.div
                                        className="h-[2px] rounded-full bg-white"
                                        animate={{ width: i === slideIndex ? 28 : 10, opacity: i === slideIndex ? 1 : 0.3 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                    <span className={`text-[9px] font-bold uppercase tracking-widest hidden md:block transition-colors duration-300 ${i === slideIndex ? s.sideLabelColor : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                        {s.sideLabel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Animated: badge → headline → sub → stats ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${slideIndex}`}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={contentTrans}
                            className="flex flex-col gap-3 sm:gap-4 lg:gap-3"
                        >
                            {/* Badge */}
                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md border self-start ${slide.badgeBg}`}>
                                <SlideIcon size={11} className={slide.badgeText} />
                                <span className={`text-[10px] sm:text-xs font-semibold tracking-widest uppercase ${slide.badgeText}`}>
                                    {slide.badge}
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-[2.25rem] leading-[1] sm:text-5xl lg:text-[3rem] xl:text-[3.5rem] font-black tracking-tighter drop-shadow-2xl">
                                {slide.headline}
                                <br />
                                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.accentColor}`}>
                                    {slide.highlight}
                                </span>
                            </h1>

                            {/* Sub */}
                            <p className="text-zinc-300 text-sm sm:text-base lg:text-sm xl:text-[0.95rem] max-w-sm sm:max-w-md leading-relaxed font-light line-clamp-2 sm:line-clamp-3">
                                {slide.sub}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-5 sm:gap-7 lg:gap-5">
                                {slide.stats.map((s) => (
                                    <div key={s.label} className="flex flex-col gap-0.5">
                                        <span className={`text-base sm:text-lg lg:text-base xl:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${slide.accentColor}`}>
                                            {s.value}
                                        </span>
                                        <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ══════════ BOTTOM BAR ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-xl sm:max-w-2xl lg:max-w-xl xl:max-w-2xl flex flex-col gap-3 sm:gap-4"
                >
                    {/* CTA */}
                    <div>
                        <Link
                            href={slide.cta}
                            className="inline-flex items-center gap-2.5 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white text-zinc-950 font-semibold uppercase tracking-wide text-xs hover:bg-zinc-200 transition"
                        >
                            {slide.ctaText}
                            <ArrowRight size={13} />
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="backdrop-blur-xl bg-black/30 p-1.5 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-full shadow-2xl">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
                            <div className="w-full flex items-center pl-3 sm:pl-4">
                                <Search className="text-zinc-400 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search parts, builds..."
                                    className="w-full h-9 sm:h-10 lg:h-9 pl-2 sm:pl-3 pr-3 bg-transparent text-sm text-white placeholder:text-zinc-500 font-medium focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto h-9 sm:h-10 lg:h-9 px-5 sm:px-6 rounded-lg sm:rounded-full bg-indigo-600 text-white text-xs sm:text-sm font-semibold tracking-wide hover:bg-indigo-500 transition-colors shrink-0"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* Scroll cue */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-30 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none"
                    aria-hidden="true"
                >
                    <span className="text-[10px] tracking-widest text-zinc-500 uppercase">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                        className="text-zinc-400"
                    >
                        <ChevronDown size={18} />
                    </motion.div>
                </motion.div>

            </Container>
        </section>
    )
}