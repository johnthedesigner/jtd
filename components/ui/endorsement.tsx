import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const getQuoteFontSize = (quote: string): string => {
    const len = quote.length
    const minLen = 150
    const maxLen = 550
    const minSize = 15
    const maxSize = 21
    const t = Math.max(0, Math.min(1, (len - minLen) / (maxLen - minLen)))
    return `${Math.round(maxSize - t * (maxSize - minSize))}px`
}

interface EndorsementProps {
    quote: string
    name: string
    title?: string
    avatarSrc?: string
    className?: string
}

const Endorsement = ({ quote, name, title, avatarSrc, className }: EndorsementProps) => (
    <article className={cn(
        "flex flex-col gap-6 rounded-lg overflow-hidden p-8 bg-primary",
        className
    )}>
        <span aria-hidden="true" style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: '72px',
            lineHeight: 0.75,
            color: 'rgba(255,255,255,0.3)',
            display: 'block',
            userSelect: 'none',
        }}>
            &#8220;
        </span>

        <blockquote style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: getQuoteFontSize(quote),
            fontWeight: 300,
            lineHeight: 1.7,
            color: '#ffffff',
            margin: 0,
            flex: 1,
        }}>
            {quote}
        </blockquote>

        <footer style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        }}>
            {avatarSrc && (
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.25)',
                }}>
                    <Image
                        src={avatarSrc}
                        alt={name}
                        width={40}
                        height={40}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.3,
                }}>
                    {name}
                </span>
                {title && (
                    <span style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '12px',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.3,
                    }}>
                        {title}
                    </span>
                )}
            </div>
        </footer>
    </article>
)

Endorsement.displayName = "Endorsement"

export { Endorsement }
export type { EndorsementProps }
