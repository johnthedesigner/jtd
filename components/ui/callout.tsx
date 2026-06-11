import * as React from "react"
import { cn } from "@/lib/utils"

const Callout = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("bg-primary text-white rounded-xl py-6 px-7", className)}
            {...props}
        />
    )
)
Callout.displayName = "Callout"

const CalloutKicker = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#cce3ff] mb-2 leading-none", className)}
            {...props}
        />
    )
)
CalloutKicker.displayName = "CalloutKicker"

const CalloutBody = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("font-sans text-[15px] text-white leading-relaxed m-0", className)}
            {...props}
        />
    )
)
CalloutBody.displayName = "CalloutBody"

export { Callout, CalloutKicker, CalloutBody }
