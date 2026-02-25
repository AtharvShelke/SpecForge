'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

const Collapsible = CollapsiblePrimitive.Root as React.FC<{
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
    disabled?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger as React.FC<{
    asChild?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent as React.FC<{
    asChild?: boolean
    forceMount?: true
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
