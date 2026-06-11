import * as React from "react"
import { cn } from "@/lib/utils"

const Nav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ className, ...props }, ref) => (
        <nav
            ref={ref}
            className={cn("flex items-center justify-between px-6 py-4 font-sans", className)}
            {...props}
        />
    )
)
Nav.displayName = "Nav"

const NavLogo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center", className)} {...props} />
    )
)
NavLogo.displayName = "NavLogo"

const NavLinks = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center gap-8", className)} {...props} />
    )
)
NavLinks.displayName = "NavLinks"

const NavLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { active?: boolean }>(
    ({ className, active, ...props }, ref) => (
        <a
            ref={ref}
            className={cn(
                "font-sans text-sm font-bold text-on-surface-body transition-colors min-h-[44px] inline-flex items-center",
                "hover:text-primary-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:rounded-sm",
                active && "text-primary-text",
                className
            )}
            {...props}
        />
    )
)
NavLink.displayName = "NavLink"

export { Nav, NavLogo, NavLinks, NavLink }
