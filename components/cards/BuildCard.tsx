import Link from 'next/link'
import { Cpu, MonitorSpeaker, MemoryStick, HardDrive, ChevronRight, Sparkles } from 'lucide-react'
import { calculateBuildPrice } from '@/lib/calculations/pricing'

const COMPONENT_ICONS: Record<string, React.ElementType> = {
    PROCESSOR: Cpu,
    GPU: MonitorSpeaker,
    RAM: MemoryStick,
    STORAGE: HardDrive,
}

const COMPONENT_COLORS: Record<string, string> = {
    PROCESSOR: 'text-blue-500',
    GPU: 'text-violet-500',
    RAM: 'text-amber-500',
    STORAGE: 'text-rose-500',
}

export default function BuildCard({ build }: any) {
    const total = calculateBuildPrice(build.items)

    const getComponent = (cat: string) =>
        build.items.find((i: any) => i.variant.product.category === cat)

    const components = ['PROCESSOR', 'GPU', 'RAM', 'STORAGE']

    return (
        <div className="group bg-white border border-zinc-100 rounded-2xl overflow-hidden
                    hover:shadow-xl hover:border-zinc-200 transition-all duration-300">

            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-blue-600/10" />
                <div className="relative">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={12} className="text-amber-400" />
                        <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">Curated</span>
                    </div>
                    <h3 className="font-bold text-white text-base leading-tight">{build.title}</h3>
                </div>
            </div>

            {/* Components */}
            <div className="p-4 space-y-2">
                {components.map(cat => {
                    const comp = getComponent(cat)
                    const Icon = COMPONENT_ICONS[cat] || Cpu
                    const color = COMPONENT_COLORS[cat] || 'text-zinc-400'

                    return (
                        <div key={cat} className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-zinc-50 flex items-center justify-center flex-shrink-0">
                                <Icon size={12} className={color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium leading-none">
                                    {cat === 'PROCESSOR' ? 'CPU' : cat}
                                </p>
                                <p className="text-xs font-medium text-zinc-800 truncate">{comp?.variant.product.name || '—'}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Total</p>
                        <p className="text-lg font-bold text-zinc-900">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                    <Link
                        href={`/builds/${build.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold
                       hover:bg-zinc-800 active:scale-[0.97] transition-all group/btn"
                    >
                        View
                        <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}