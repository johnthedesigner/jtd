import { useState, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Lock, KeyRound } from 'lucide-react';
import { PasswordProvider } from '../utils/context';
import PasswordDialog from './PasswordDialog';

const CaseStudyCard = ({ item }) => {
    const { authenticated } = useContext(PasswordProvider);
    const isAccessible = authenticated || !item.private;
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <article className="relative flex flex-col md:flex-row bg-primary hover:bg-primary-light rounded-lg overflow-hidden transition-colors transition-transform duration-150 hover:-translate-y-1 ring-1 ring-black/10">
            {/* Text panel */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-6 p-10">
                {isAccessible ? (
                    <>
                        <div className="flex flex-col gap-4">
                            <span className="self-start font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 bg-white/[0.18] rounded-full px-3 py-[5px]">
                                {item.company}
                            </span>
                            <h2 className="font-heading text-[34px] font-semibold leading-[1.15] tracking-[-0.015em] text-white">
                                {item.title}
                            </h2>
                            <p className="font-sans text-[15px] leading-[1.7] text-white/80">
                                {item.description}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-2 font-sans text-[14px] font-bold text-white self-start">
                            View Case Study <ArrowRight className="w-4 h-4" />
                        </span>
                        <Link
                            href={item.href}
                            className="absolute inset-0"
                            aria-label={`View ${item.title} case study`}
                        />
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            <span className="self-start inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 border border-white/35 rounded-full px-3 py-[5px]">
                                <Lock className="w-3 h-3" />
                                Private
                            </span>
                            <h2 className="font-heading text-[34px] font-semibold leading-[1.15] tracking-[-0.015em] text-white">
                                Shh. This one's locked.
                            </h2>
                            <p className="font-sans text-[15px] leading-[1.7] text-white/80">
                                Some of my work isn't ready for the whole world to see. Get in touch and I'll share the password.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-2 font-sans text-[14px] font-bold text-white/70 self-start">
                            <KeyRound className="w-4 h-4" /> Enter the password
                        </span>
                        <PasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
                        <button
                            className="absolute inset-0"
                            onClick={() => setDialogOpen(true)}
                            aria-label="Enter password to view this case study"
                        />
                    </>
                )}
            </div>

            {/* Image panel */}
            <div className="w-4/5 ml-auto min-h-[400px] md:ml-0 md:min-h-0 md:h-auto md:w-[45%] md:flex-shrink-0 overflow-hidden">
                <Image
                    src={isAccessible ? item.imageSharp : item.imageBlurred}
                    width={900}
                    height={1200}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    alt={isAccessible ? `${item.title} case study preview` : 'Private case study'}
                />
            </div>
        </article>
    );
};

export default CaseStudyCard;
