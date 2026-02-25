'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Typed primitives ─────────────────────────────────────────────────────────
const Select = SelectPrimitive.Root as React.FC<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  dir?: 'ltr' | 'rtl'
  name?: string
  disabled?: boolean
  required?: boolean
  children?: React.ReactNode
}>

const SelectGroup = SelectPrimitive.Group as React.FC<{
  children?: React.ReactNode
  [key: string]: unknown
}>

const SelectValue = SelectPrimitive.Value as React.FC<{
  placeholder?: string
  children?: React.ReactNode
  [key: string]: unknown
}>

// ─── SelectTrigger ────────────────────────────────────────────────────────────
const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const Comp = SelectPrimitive.Trigger as any
  const Icon = SelectPrimitive.Icon as any
  return (
    <Comp
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Icon>
    </Comp>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

// ─── SelectScrollUpButton ─────────────────────────────────────────────────────
const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const Comp = SelectPrimitive.ScrollUpButton as any
    return (
      <Comp
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
      >
        {children ?? <ChevronUp className="h-4 w-4" />}
      </Comp>
    )
  }
)
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

// ─── SelectScrollDownButton ───────────────────────────────────────────────────
const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const Comp = SelectPrimitive.ScrollDownButton as any
    return (
      <Comp
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
      >
        {children ?? <ChevronDown className="h-4 w-4" />}
      </Comp>
    )
  }
)
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

// ─── SelectContent ────────────────────────────────────────────────────────────
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'item-aligned' | 'popper'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  avoidCollisions?: boolean
  forceMount?: true
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onPointerDownOutside?: (e: Event) => void
}
const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = 'popper', ...props }, ref) => {
    const Portal = SelectPrimitive.Portal as any
    const Comp = SelectPrimitive.Content as any
    const Viewport = SelectPrimitive.Viewport as any
    return (
      <Portal>
        <Comp
          ref={ref}
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className
          )}
          position={position}
          {...props}
        >
          <SelectScrollUpButton />
          <Viewport
            className={cn(
              'p-1',
              position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
            )}
          >
            {children}
          </Viewport>
          <SelectScrollDownButton />
        </Comp>
      </Portal>
    )
  }
)
SelectContent.displayName = 'SelectContent'

// ─── SelectLabel ──────────────────────────────────────────────────────────────
const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const Comp = SelectPrimitive.Label as any
    return (
      <Comp
        ref={ref}
        className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
        {...props}
      />
    )
  }
)
SelectLabel.displayName = 'SelectLabel'

// ─── SelectItem ───────────────────────────────────────────────────────────────
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  textValue?: string
}
const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, textValue, ...props }, ref) => {
    const Comp = SelectPrimitive.Item as any
    const ItemText = SelectPrimitive.ItemText as any
    const ItemIndicator = SelectPrimitive.ItemIndicator as any
    return (
      <Comp
        ref={ref}
        value={value}
        disabled={disabled}
        textValue={textValue}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <ItemIndicator>
            <Check className="h-4 w-4" />
          </ItemIndicator>
        </span>
        <ItemText>{children}</ItemText>
      </Comp>
    )
  }
)
SelectItem.displayName = 'SelectItem'

// ─── SelectSeparator ──────────────────────────────────────────────────────────
const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const Comp = SelectPrimitive.Separator as any
    return (
      <Comp
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
      />
    )
  }
)
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}