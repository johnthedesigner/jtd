import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
    "aria-label"?: string
}

const Modal = ({ open, onClose, children, className, "aria-label": ariaLabel }: ModalProps) => {
    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        document.addEventListener("keydown", onKey)
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", onKey)
            document.body.style.overflow = ""
        }
    }, [open, onClose])

    if (!open || typeof document === "undefined") return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Scrim */}
            <div
                className="absolute inset-0 bg-on-surface/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                className={cn(
                    "relative z-10 w-full max-w-md",
                    "bg-surface-overlay rounded-2xl shadow-lg p-7",
                    className
                )}
            >
                <button
                    onClick={onClose}
                    className={cn(
                        "absolute right-5 top-5 rounded-sm text-on-surface-muted",
                        "hover:text-on-surface transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-1",
                        "min-h-[44px] min-w-[44px] flex items-center justify-center"
                    )}
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>,
        document.body
    )
}
Modal.displayName = "Modal"

const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col gap-2 mb-5 pr-8", className)} {...props} />
)
ModalHeader.displayName = "ModalHeader"

const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h2
            ref={ref}
            className={cn("font-heading text-[22px] font-normal leading-snug text-on-surface m-0", className)}
            {...props}
        />
    )
)
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("font-sans text-[15px] text-on-surface-body leading-relaxed m-0", className)}
            {...props}
        />
    )
)
ModalDescription.displayName = "ModalDescription"

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex gap-2 justify-end mt-6", className)} {...props} />
)
ModalFooter.displayName = "ModalFooter"

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter }
