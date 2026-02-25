'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root as React.FC<{
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
    orientation?: 'horizontal' | 'vertical'
    dir?: 'ltr' | 'rtl'
    activationMode?: 'automatic' | 'manual'
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const Comp = TabsPrimitive.List as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
                    className
                )}
                {...props}
            />
        )
    }
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
    asChild?: boolean
}
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className, value, ...props }, ref) => {
        const Comp = TabsPrimitive.Trigger as any
        return (
            <Comp
                ref={ref}
                value={value}
                className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                    className
                )}
                {...props}
            />
        )
    }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    forceMount?: true
    asChild?: boolean
}
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className, value, ...props }, ref) => {
        const Comp = TabsPrimitive.Content as any
        return (
            <Comp
                ref={ref}
                value={value}
                className={cn(
                    'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    className
                )}
                {...props}
            />
        )
    }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
