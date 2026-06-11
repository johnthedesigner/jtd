import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-sans text-sm font-bold rounded-sm transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-primary text-white px-[22px] py-[10px] hover:bg-primary-hover hover:text-white active:bg-[#0858b5] active:text-white",
                ghost:   "bg-transparent text-primary-text border border-primary px-5 py-[9px] hover:bg-primary-subtle active:bg-primary-subtle",
                white:   "bg-white text-primary-text px-[22px] py-[10px] hover:bg-[#f0f7ff] active:bg-[#e8f2ff]",
            },
        },
        defaultVariants: {
            variant: "primary",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
