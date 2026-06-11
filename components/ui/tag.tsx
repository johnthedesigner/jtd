import * as React from "react"
import { cn } from "@/lib/utils"

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {}

function Tag({ className, ...props }: TagProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-sans text-xs text-on-surface-body",
                "rounded-full px-3 py-[3px] leading-none whitespace-nowrap",
                "bg-surface-subtle",
                className
            )}
            {...props}
        />
    )
}

export { Tag }
