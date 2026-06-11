import Image from 'next/image'

const PingPong = ({ src, alt, width, height, caption, reverse = false, children }) => (
    <div className={`flex flex-col items-center gap-8 md:gap-6 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        <figure className="w-full md:w-[60%] flex-shrink-0 m-0 flex flex-col gap-3">
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {caption && (
                <figcaption style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    letterSpacing: '0.01em',
                    color: 'var(--color-on-surface-muted)',
                    paddingLeft: '4px',
                }}>
                    {caption}
                </figcaption>
            )}
        </figure>

        <div
            className="w-full md:w-[40%] flex flex-col gap-4 md:px-8"
            style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '17px',
                lineHeight: 1.7,
                color: 'var(--color-on-surface-body)',
            }}
        >
            {children}
        </div>
    </div>
)

const PingPongHeading = ({ children, as: Tag = 'h2' }) => (
    <Tag style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: 'var(--color-on-surface)',
        margin: 0,
    }}>
        {children}
    </Tag>
)

export { PingPong, PingPongHeading }
