'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    type?: 'auto' | 'always' | 'scroll' | 'hover'
    scrollHideDelay?: number
    dir?: 'ltr' | 'rtl'
}>(({ className, children, ...props }, ref) => {
    const Root = ScrollAreaPrimitive.Root as any
    const Viewport = ScrollAreaPrimitive.Viewport as any
    const Corner = ScrollAreaPrimitive.Corner as any
    return (
        <Root
            ref={ref}
            className={cn('relative overflow-hidden', className)}
            {...props}
        >
            <Viewport className="h-full w-full rounded-[inherit]">
                {children}
            </Viewport>
            <ScrollBar />
            <Corner />
        </Root>
    )
})
ScrollArea.displayName = 'ScrollArea'

const ScrollBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'horizontal' | 'vertical'
    forceMount?: true
}>(({ className, orientation = 'vertical', ...props }, ref) => {
    const Scrollbar = ScrollAreaPrimitive.Scrollbar as any
    const Thumb = ScrollAreaPrimitive.Thumb as any
    return (
        <Scrollbar
            ref={ref}
            orientation={orientation}
            className={cn(
                'flex touch-none select-none transition-colors',
                orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
                orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
                className
            )}
            {...props}
        >
            <Thumb className="relative flex-1 rounded-full bg-border" />
        </Scrollbar>
    )
})
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
