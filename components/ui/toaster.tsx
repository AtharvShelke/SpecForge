"use client"

import * as React from "react"
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            {toasts.map(function ({ id, title, description, action, ...props }) {
                return (
                    <Toast key={id} {...props}>
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && (
                                <ToastDescription>
                                    {(() => {
                                        if (typeof description === "string" || React.isValidElement(description)) {
                                            return description
                                        }
                                        if (Array.isArray(description)) {
                                            return description
                                                .map((d: any) => (typeof d === "string" ? d : d.message || JSON.stringify(d)))
                                                .join(", ")
                                        }
                                        if (typeof description === "object" && description !== null) {
                                            return (description as any).message || JSON.stringify(description)
                                        }
                                        return String(description)
                                    })()}
                                </ToastDescription>
                            )}
                        </div>
                        {action}
                        <ToastClose />
                    </Toast>
                )
            })}
            <ToastViewport />
        </ToastProvider>
    )
}
