'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Re-export primitives ────────────────────────────────────────────────────
const Dialog = DialogPrimitive.Root as React.FC<{
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
    modal?: boolean
    children?: React.ReactNode
}>

const DialogTrigger = DialogPrimitive.Trigger as React.FC<{
    asChild?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

const DialogPortal = DialogPrimitive.Portal as React.FC<{
    children?: React.ReactNode
}>

const DialogClose = DialogPrimitive.Close as React.FC<{
    asChild?: boolean
    children?: React.ReactNode
    className?: string
    [key: string]: unknown
}>

// ─── DialogOverlay ────────────────────────────────────────────────────────────
interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
    forceMount?: true
}
const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
    ({ className, ...props }, ref) => {
        const Comp = DialogPrimitive.Overlay as any
        return (
            <Comp
                ref={ref}
                className={cn(
                    'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    className
                )}
                {...props}
            />
        )
    }
)
DialogOverlay.displayName = 'DialogOverlay'

// ─── DialogContent ────────────────────────────────────────────────────────────
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    forceMount?: true
    onEscapeKeyDown?: (event: KeyboardEvent) => void
    onPointerDownOutside?: (event: Event) => void
    onInteractOutside?: (event: Event) => void
    onOpenAutoFocus?: (event: Event) => void
    onCloseAutoFocus?: (event: Event) => void
}
const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className, children, ...props }, ref) => {
        const Comp = DialogPrimitive.Content as any
        return (
            <DialogPortal>
                <DialogOverlay />
                <Comp
                    ref={ref}
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                        className
                    )}
                    {...props}
                >
                    {children}
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </Comp>
            </DialogPortal>
        )
    }
)
DialogContent.displayName = 'DialogContent'

// ─── DialogHeader / Footer ────────────────────────────────────────────────────
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
        {...props}
    />
)
DialogFooter.displayName = 'DialogFooter'

// ─── DialogTitle ──────────────────────────────────────────────────────────────
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => {
        const Comp = DialogPrimitive.Title as any
        return (
            <Comp
                ref={ref}
                className={cn('text-lg font-semibold leading-none tracking-tight', className)}
                {...props}
            />
        )
    }
)
DialogTitle.displayName = 'DialogTitle'

// ─── DialogDescription ───────────────────────────────────────────────────────
const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    const Comp = DialogPrimitive.Description as any
    return (
        <Comp
            ref={ref}
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
})
DialogDescription.displayName = 'DialogDescription'

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
