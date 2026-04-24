'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Search } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { HERO_SLIDES } from '@/data/constants'
import Image from 'next/image'

const SLIDE_DURATION = 5400

export default function HeroSection() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [slideIndex, setSlideIndex] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const startTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)
        }, SLIDE_DURATION)
    }, [])

    useEffect(() => {
        startTimer()
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [startTimer])

    const goToSlide = useCallback((index: number) => {
        setSlideIndex(index)
        startTimer()
    }, [startTimer])

    const handleSearch = useCallback((event: React.FormEvent) => {
        event.preventDefault()
        const trimmed = query.trim()
        if (!trimmed) return
        router.push(`/products?q=${encodeURIComponent(trimmed)}`)
    }, [query, router])

    const slide = HERO_SLIDES[slideIndex]

    return (
        <section className="relative overflow-hidden px-3 pt-3 sm:px-5 sm:pt-4">
            <Container maxWidth="2xl">
                <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,246,242,0.94))] px-6 py-8 shadow-[0_35px_90px_-58px_rgba(20,30,59,0.45)] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                    <div className="hero-grid absolute inset-0 opacity-70" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`glow-${slideIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background: `radial-gradient(circle at 82% 26%, ${slide.accentGlow}, transparent 34%)`,
                            }}
                        />
                    </AnimatePresence>

                    <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
                        <div className="max-w-3xl">
                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                <span className="section-kicker">Premium PC Commerce</span>
                                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                                    Curated hardware. Cleaner checkout. Faster decisions.
                                </span>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`content-${slideIndex}`}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                            <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${slide.accentColor}`} />
                                            {slide.badge}
                                        </div>

                                        <div className="max-w-2xl space-y-4">
                                            <h1 className="text-5xl leading-[0.92] text-slate-950 sm:text-6xl lg:text-7xl">
                                                {slide.headline}
                                                <br />
                                                <span className={`bg-gradient-to-r ${slide.accentColor} bg-clip-text text-transparent`}>
                                                    {slide.highlight}
                                                </span>
                                            </h1>
                                            <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                                                {slide.sub}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {slide.stats.map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="rounded-[1.5rem] border border-white/70 bg-white/82 px-4 py-4 shadow-[0_16px_36px_-34px_rgba(20,30,59,0.34)]"
                                            >
                                                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                                    {stat.label}
                                                </p>
                                                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                                                    {stat.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/products"
                                    className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                                >
                                    Shop Components
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href="/builds/new"
                                    className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-6 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                                >
                                    Start a Custom Build
                                </Link>
                            </div>

                            <form
                                onSubmit={handleSearch}
                                className="mt-8 flex flex-col gap-3 rounded-[1.75rem] border border-white/85 bg-white/88 p-3 shadow-[0_24px_60px_-42px_rgba(20,30,59,0.28)] sm:flex-row sm:items-center"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
                                    <Search className="size-4 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search GPUs, CPUs, DDR5 memory, creator builds..."
                                        className="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800"
                                >
                                    Search catalog
                                </button>
                            </form>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`visual-${slideIndex}`}
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                    className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 p-6 text-white soft-shadow"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-r ${slide.accentColor} opacity-20 blur-3xl`} />
                                    <div className="relative aspect-[4/4.6] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_40%),linear-gradient(180deg,#111827,#020617)]">
                                        <Image
                                            src={slide.image}
                                            alt={slide.sideLabel}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 36vw"
                                            className="h-full w-full object-cover opacity-88"
                                            priority={slideIndex === 0}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                                                {slide.sideLabel}
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                                                Systems built for momentum
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                {HERO_SLIDES.map((item, index) => (
                                    <button
                                        key={item.sideLabel}
                                        onClick={() => goToSlide(index)}
                                        className={`rounded-[1.4rem] border px-4 py-4 text-left transition-all duration-300 ${
                                            index === slideIndex
                                                ? 'border-slate-900 bg-slate-950 text-white shadow-[0_24px_48px_-34px_rgba(15,23,42,0.72)]'
                                                : 'border-white/80 bg-white/82 text-slate-700 hover:border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] opacity-70">
                                            {item.sideLabel}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold tracking-[-0.02em]">
                                            {item.badge}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
