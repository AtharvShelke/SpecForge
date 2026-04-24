import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-[1.15rem] border border-border/90 bg-white/80 px-4 py-2 text-sm text-foreground shadow-[0_16px_36px_-32px_rgba(22,34,65,0.26)] transition-all placeholder:text-muted-foreground/85 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
