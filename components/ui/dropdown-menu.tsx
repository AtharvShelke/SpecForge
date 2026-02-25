'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Typed primitives (Radix v1 doesn't declare children in React 19) ────────
const DropdownMenu = DropdownMenuPrimitive.Root as React.FC<{
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
    modal?: boolean
    children?: React.ReactNode
}>

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger as React.FC<{
    asChild?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const DropdownMenuGroup = DropdownMenuPrimitive.Group as React.FC<{
    children?: React.ReactNode
    [key: string]: unknown
}>

const DropdownMenuPortal = DropdownMenuPrimitive.Portal as React.FC<{
    children?: React.ReactNode
}>

const DropdownMenuSub = DropdownMenuPrimitive.Sub as React.FC<{
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
    children?: React.ReactNode
}>

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup as React.FC<{
    value?: string
    onValueChange?: (value: string) => void
    children?: React.ReactNode
    [key: string]: unknown
}>

// ─── DropdownMenuSubTrigger ───────────────────────────────────────────────────
interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean
    disabled?: boolean
    textValue?: string
}
const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>(
    ({ className, inset, children, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.SubTrigger as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
                    inset && 'pl-8',
                    className
                )}
                {...props}
            >
                {children}
                <ChevronRight className="ml-auto h-4 w-4" />
            </Comp>
        )
    }
)
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

// ─── DropdownMenuSubContent ───────────────────────────────────────────────────
interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
    loop?: boolean
    onEscapeKeyDown?: (e: KeyboardEvent) => void
    onFocusOutside?: (e: Event) => void
    onInteractOutside?: (e: Event) => void
    forceMount?: true
    sideOffset?: number
    alignOffset?: number
    avoidCollisions?: boolean
}
const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
    ({ className, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.SubContent as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                )}
                {...props}
            />
        )
    }
)
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

// ─── DropdownMenuContent ──────────────────────────────────────────────────────
interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    loop?: boolean
    onCloseAutoFocus?: (e: Event) => void
    onEscapeKeyDown?: (e: KeyboardEvent) => void
    onPointerDownOutside?: (e: Event) => void
    onFocusOutside?: (e: Event) => void
    onInteractOutside?: (e: Event) => void
    forceMount?: true
    side?: 'top' | 'right' | 'bottom' | 'left'
    sideOffset?: number
    align?: 'start' | 'center' | 'end'
    alignOffset?: number
    avoidCollisions?: boolean
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    sticky?: 'partial' | 'always'
    hideWhenDetached?: boolean
}
const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
    ({ className, sideOffset = 4, children, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.Content as any
        return (
            <DropdownMenuPortal>
                <Comp
                    ref={ref}
                    sideOffset={sideOffset}
                    className={cn(
                        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                        className
                    )}
                    {...props}
                >
                    {children}
                </Comp>
            </DropdownMenuPortal>
        )
    }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

// ─── DropdownMenuItem ─────────────────────────────────────────────────────────
interface DropdownMenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    inset?: boolean
    disabled?: boolean
    onSelect?: (event: Event) => void
    textValue?: string
    asChild?: boolean
}
const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
    ({ className, inset, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.Item as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    inset && 'pl-8',
                    className
                )}
                {...props}
            />
        )
    }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

// ─── DropdownMenuCheckboxItem ─────────────────────────────────────────────────
interface DropdownMenuCheckboxItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    checked?: boolean | 'indeterminate'
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    onSelect?: (event: Event) => void
    textValue?: string
}
const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
    ({ className, children, checked, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.CheckboxItem as any
        const Indicator = DropdownMenuPrimitive.ItemIndicator as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    className
                )}
                checked={checked}
                {...props}
            >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Indicator>
                        <Check className="h-4 w-4" />
                    </Indicator>
                </span>
                {children}
            </Comp>
        )
    }
)
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

// ─── DropdownMenuRadioItem ────────────────────────────────────────────────────
interface DropdownMenuRadioItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    value: string
    disabled?: boolean
    onSelect?: (event: Event) => void
    textValue?: string
}
const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>(
    ({ className, children, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.RadioItem as any
        const Indicator = DropdownMenuPrimitive.ItemIndicator as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    className
                )}
                {...props}
            >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Indicator>
                        <Circle className="h-2 w-2 fill-current" />
                    </Indicator>
                </span>
                {children}
            </Comp>
        )
    }
)
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

// ─── DropdownMenuLabel ────────────────────────────────────────────────────────
interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean
}
const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
    ({ className, inset, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.Label as any
        return (
            <Comp
                ref={ref}
                className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
                {...props}
            />
        )
    }
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// ─── DropdownMenuSeparator ────────────────────────────────────────────────────
const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const Comp = DropdownMenuPrimitive.Separator as any
        return (
            <Comp
                ref={ref}
                className={cn('-mx-1 my-1 h-px bg-muted', className)}
                {...props}
            />
        )
    }
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

// ─── DropdownMenuShortcut ─────────────────────────────────────────────────────
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
)
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
}
