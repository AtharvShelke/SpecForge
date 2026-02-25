'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider as React.FC<{
    delayDuration?: number
    skipDelayDuration?: number
    disableHoverableContent?: boolean
    children?: React.ReactNode
}>

const Tooltip = TooltipPrimitive.Root as React.FC<{
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    delayDuration?: number
    disableHoverableContent?: boolean
    children?: React.ReactNode
}>

const TooltipTrigger = TooltipPrimitive.Trigger as React.FC<{
    asChild?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    alignOffset?: number
    avoidCollisions?: boolean
    arrowPadding?: number
    sticky?: 'partial' | 'always'
    hideWhenDetached?: boolean
    forceMount?: true
    onEscapeKeyDown?: (e: KeyboardEvent) => void
    onPointerDownOutside?: (e: Event) => void
}>(({ className, sideOffset = 4, ...props }, ref) => {
    const Comp = TooltipPrimitive.Content as any
    return (
        <Comp
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    )
})
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
