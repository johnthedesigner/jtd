import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, FlaskConical } from 'lucide-react'

/**
 * One experiment, as a card.
 *
 * Mirrors `CaseStudyCard` — a blue panel beside a picture, the whole thing
 * one link, the same radius, ring, hover lift and type scale — so the
 * homepage reads as one page rather than two sections built by different
 * hands. The eyebrow is the same translucent-white pill on the brand
 * colour, with the flask alongside it.
 *
 * Two differences, both deliberate: an experiment may have no picture yet,
 * and a card that collapses to text rather than showing an empty frame
 * means a new one can be listed the day it exists; and the picture sits on
 * the scene's own near-black rather than the brand blue, because these
 * renders *are* near-black at the edges and a blue surround would fight the
 * letterboxing.
 */
const ExperimentCard = ({ item }) => (
    <article className="relative flex flex-col overflow-hidden rounded-lg bg-primary ring-1 ring-black/10 transition-colors transition-transform duration-150 hover:-translate-y-1 hover:bg-primary-light md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 p-10">
            <div className="flex flex-col gap-4">
                {/* The same flask the header's field is built from, so the
                    two read as one idea. `currentColor`, so it cannot drift
                    from the label beside it. */}
                <span className="flex items-center gap-1.5 self-start rounded-full bg-white/[0.18] px-3 py-[5px] font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/90">
                    <FlaskConical className="h-[13px] w-[13px]" aria-hidden />
                    Experiment
                </span>
                <h2 className="font-heading text-[34px] font-semibold leading-[1.15] tracking-[-0.015em] text-white">
                    {item.title}
                </h2>
                {/* `my-0`: the site stylesheet gives every `p` a 1rem/2rem
                    margin, which opens a dead band inside the card. */}
                {item.subtitle && (
                    <p className="my-0 font-sans text-[15px] font-bold text-white/70">
                        {item.subtitle}
                    </p>
                )}
                <p className="my-0 font-sans text-[15px] leading-[1.7] text-white/80">
                    {item.description}
                </p>
            </div>
            <span className="inline-flex items-center gap-2 self-start font-sans text-[14px] font-bold text-white">
                Open {item.title} <ArrowRight className="h-4 w-4" />
            </span>
        </div>

        {item.thumbnail && (
            /*
              `contain` by default: this panel is tall and narrow beside the
              text, and cropping a 16:10 render to fill it cuts whatever sits
              near the edges — it took the score off the first Courtside
              render. An entry opts into `cover` with `thumbnailFit`, which
              is right for a render framed for it: roughly square, with
              deliberate margin for a narrow panel to bite into.
            */
            <div className="relative aspect-[16/10] w-full shrink-0 bg-[#0b0d12] md:aspect-auto md:w-[46%]">
                <Image
                    src={item.thumbnail}
                    alt={item.thumbnailAlt ?? ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 46vw"
                    className={item.thumbnailFit === 'cover' ? 'object-cover' : 'object-contain'}
                />
            </div>
        )}

        <Link href={item.href} className="absolute inset-0" aria-label={`Open ${item.title}`} />
    </article>
)

export default ExperimentCard
