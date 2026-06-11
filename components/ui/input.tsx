import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
    error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                ref={ref}
                className={cn(
                    "flex w-full rounded-sm bg-white font-sans text-sm text-on-surface-body",
                    "min-h-[44px] px-[14px] py-[9px]",
                    "border border-border-mid",
                    "placeholder:text-on-surface-muted",
                    "transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-0",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-error focus:ring-error",
                    className
                )}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
