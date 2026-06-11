import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center font-sans text-xs font-bold rounded-full px-3 py-[3px] leading-none whitespace-nowrap",
    {
        variants: {
            variant: {
                solid:   "bg-primary text-white",
                outline: "bg-white text-primary-text border-[1.5px] border-primary",
            },
        },
        defaultVariants: {
            variant: "solid",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
