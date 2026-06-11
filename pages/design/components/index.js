import { useState } from 'react'
import Head from 'next/head'
import DesignLayout from '@/components/DesignLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tag } from '@/components/ui/tag'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/card'
import { Callout, CalloutKicker, CalloutBody } from '@/components/ui/callout'
import { Nav, NavLogo, NavLinks, NavLink } from '@/components/ui/nav'
import { CodeBlock } from '@/components/ui/codeblock'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { Endorsement } from '@/components/ui/endorsement'

const ModalDemo = () => {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
            <Modal open={open} onClose={() => setOpen(false)} aria-label="Demo modal">
                <ModalHeader>
                    <ModalTitle>Got the password?</ModalTitle>
                    <ModalDescription>It&apos;s ok if not, just ask John.</ModalDescription>
                </ModalHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Label htmlFor="modal-demo-pw">Password</Label>
                    <Input id="modal-demo-pw" type="password" placeholder="Enter the password" />
                </div>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setOpen(false)}>Submit</Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

const specimenLabelStyle = { fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }
const specimenDescStyle = { fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', color: 'var(--color-on-surface-muted)', marginTop: '2px', marginBottom: 0 }

const Specimen = ({ name, description, dark = false, children }) => (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
            <p style={specimenLabelStyle}>{name}</p>
            {description && <p style={specimenDescStyle}>{description}</p>}
        </div>
        <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: dark ? 'var(--color-on-surface)' : 'var(--color-surface)' }}>
            {children}
        </div>
    </div>
)

export default function DesignComponents() {
    return (
        <>
            <Head><title>Design System — Components</title></Head>
            <DesignLayout>

                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '34px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--color-on-surface)', margin: 0 }}>Components</h1>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', color: 'var(--color-on-surface-body)', marginTop: '8px' }}>
                        Generic, reusable UI kit. Lives in <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>components/ui/</code>
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '48px' }}>

                    <Specimen name="Button" description="Three variants. Always min-h-[44px] for touch target compliance.">
                        <Button variant="primary">Primary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="white">White</Button>
                        <Button variant="primary" disabled>Disabled</Button>
                    </Specimen>

                    <Specimen name="Button — on dark" dark>
                        <Button variant="primary">Primary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="white">White</Button>
                    </Specimen>

                    <Specimen name="Input + Label" description="Label role is always uppercase. Input has resting, focus, and error states.">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '256px' }}>
                            <Label htmlFor="demo-1">Email address</Label>
                            <Input id="demo-1" placeholder="john@johnthedesigner.com" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '256px' }}>
                            <Label htmlFor="demo-2">Password</Label>
                            <Input id="demo-2" type="password" placeholder="Enter password" error />
                        </div>
                    </Specimen>

                    <Specimen name="Badge" description="Pill shape. Solid for primary labels; outline for secondary.">
                        <Badge variant="solid">Figma Plugin</Badge>
                        <Badge variant="outline">Salesforce</Badge>
                        <Badge variant="solid">10k+ users</Badge>
                        <Badge variant="outline">Private</Badge>
                    </Specimen>

                    <Specimen name="Tag" description="Neutral pill for taxonomy, metadata, and filter chips.">
                        <Tag>Design Systems</Tag>
                        <Tag>AI / ML</Tag>
                        <Tag>Figma Plugin</Tag>
                        <Tag>0 → 1</Tag>
                        <Tag>B2B SaaS</Tag>
                    </Specimen>

                    <Specimen name="Card" description="Raised surface container. shadow-sm + rounded-lg. Compose with subcomponents.">
                        <Card style={{ width: '280px' }}>
                            <CardHeader>
                                <CardTitle>Paletteer</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', color: 'var(--color-on-surface-body)', lineHeight: 1.65, margin: 0 }}>
                                    A Figma plugin for generating accessible color palettes from seed colors.
                                </p>
                            </CardBody>
                            <CardFooter>
                                <Badge variant="solid">10k+ users</Badge>
                            </CardFooter>
                        </Card>
                    </Specimen>

                    <Specimen name="Callout" description="High-emphasis block for key insights. Uses primary fill.">
                        <Callout style={{ maxWidth: '480px' }}>
                            <CalloutKicker>Key outcome</CalloutKicker>
                            <CalloutBody>
                                Adoption increased by 40% in the first quarter after launch — without any additional marketing spend.
                            </CalloutBody>
                        </Callout>
                    </Specimen>

                    <Specimen name="Nav" description="Site navigation bar. NavLink accepts an active prop for current-page state.">
                        <Nav style={{ width: '100%' }}>
                            <NavLogo>
                                <svg width="72" height="33" viewBox="0 0 90 41" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <rect x="0.125" width="89.75" height="41" rx="6" fill="var(--color-primary)" />
                                    <path d="M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z" fill="white" />
                                    <path d="M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z" fill="white" />
                                    <path d="M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z" fill="white" />
                                </svg>
                            </NavLogo>
                            <NavLinks>
                                <NavLink href="/work" active>Work</NavLink>
                                <NavLink href="/about">About</NavLink>
                            </NavLinks>
                        </Nav>
                    </Specimen>

                    <Specimen name="CodeBlock" description="Code snippet display. Language label + copy-to-clipboard header. Uses system monospace (ui-monospace); swap in Geist Mono via next/font/local when available.">
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <CodeBlock language="css">{`.token-swatch {
  background: var(--color-primary);
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
}`}</CodeBlock>
                            <CodeBlock language="js">{`import { palettes } from '@/utils/colorUtils'

const accent = palettes['sunglow']?.[7]?.value ?? 'var(--color-primary)'`}</CodeBlock>
                        </div>
                    </Specimen>

                    <Specimen name="Modal" description="Custom modal, no Radix dependency. Controlled via open + onClose props. Escape key and click-outside dismiss. Body scroll lock while open.">
                        <ModalDemo />
                    </Specimen>

                    <Specimen name="Endorsement" description="Testimonial card. Primary blue background, Fraunces italic quote, optional circular avatar, name, and title. Compose multiple in a grid for a 'Words from Friends' section.">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                            <Endorsement
                                quote="...The best way I can describe working with John is 'effortless'... John is collaborative and flexible, while remaining a decisive advocate for his perspective. His sense of humor, positivity, and humbleness uplifts any team he is working with..."
                                name="Michelle R."
                                title="Director of Product Management"
                                avatarSrc="/endorsements/michelle.jpg"
                            />
                            <Endorsement
                                quote="John is one of the most deliberate, thoughtful, and intentional designers I've worked with. I was fortunate to collaborate with him on improving our company's design challenge interview, where he married prior experience with present circumstances to vastly improve the efficacy of our candidate interview process... Any design team would be lucky to have John in their corner!"
                                name="Gabe O."
                                title="Product Designer"
                                avatarSrc="/endorsements/gabe.jpg"
                            />
                            <Endorsement
                                quote="...John and I collaborated on two different products (each of us owned one) and it was clear from day one his skillset was unique. He had the innate ability to tackle a problem with scalability and consistency at the forefront, something I believe we really needed across both of our products... I have worked with a number of designers in my career and I would have to say his approach has been one of the most thought out and effective approaches I have seen. Not only did he move fast, every decision was intentional and moved the needle forward..."
                                name="Darsh K."
                                title="Product Design Manager"
                                avatarSrc="/endorsements/darsh.jpg"
                            />
                        </div>
                    </Specimen>


</div>
            </DesignLayout>
        </>
    )
}
