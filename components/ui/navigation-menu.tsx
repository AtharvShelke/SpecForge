'use client'

import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cva } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Typed primitives ─────────────────────────────────────────────────────────
const NavigationMenu = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & {
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  delayDuration?: number
  skipDelayDuration?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}>(({ className, children, ...props }, ref) => {
  const Comp = NavigationMenuPrimitive.Root as any
  return (
    <Comp
      ref={ref}
      className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </Comp>
  )
})
NavigationMenu.displayName = 'NavigationMenu'

const NavigationMenuList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => {
    const Comp = NavigationMenuPrimitive.List as any
    return (
      <Comp
        ref={ref}
        className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)}
        {...props}
      />
    )
  }
)
NavigationMenuList.displayName = 'NavigationMenuList'

const NavigationMenuItem = NavigationMenuPrimitive.Item as React.FC<{
  value?: string
  children?: React.ReactNode
  [key: string]: unknown
}>

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
)

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const Comp = NavigationMenuPrimitive.Trigger as any
    return (
      <Comp
        ref={ref}
        className={cn(navigationMenuTriggerStyle(), 'group', className)}
        {...props}
      >
        {children}{' '}
        <ChevronDown
          className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </Comp>
    )
  }
)
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger'

const NavigationMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  forceMount?: true
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onPointerDownOutside?: (e: Event) => void
  onFocusOutside?: (e: Event) => void
  onInteractOutside?: (e: Event) => void
}>(({ className, ...props }, ref) => {
  const Comp = NavigationMenuPrimitive.Content as any
  return (
    <Comp
      ref={ref}
      className={cn(
        'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto',
        className
      )}
      {...props}
    />
  )
})
NavigationMenuContent.displayName = 'NavigationMenuContent'

const NavigationMenuLink = NavigationMenuPrimitive.Link as React.FC<{
  active?: boolean
  asChild?: boolean
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}>

const NavigationMenuViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  forceMount?: true
}>(({ className, ...props }, ref) => {
  const Comp = NavigationMenuPrimitive.Viewport as any
  return (
    <div className={cn('absolute left-0 top-full flex justify-center')}>
      <Comp
        className={cn(
          'origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
})
NavigationMenuViewport.displayName = 'NavigationMenuViewport'

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  forceMount?: true
}>(({ className, ...props }, ref) => {
  const Comp = NavigationMenuPrimitive.Indicator as any
  return (
    <Comp
      ref={ref}
      className={cn(
        'top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in',
        className
      )}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </Comp>
  )
})
NavigationMenuIndicator.displayName = 'NavigationMenuIndicator'

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
