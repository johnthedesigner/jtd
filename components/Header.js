import Link from 'next/link'
import { useState } from 'react'
import { palettes } from '../utils/colorUtils'

import {
    InstagramIcon,
    LinkedinIcon,
    ThreadsIcon,
    TwitterIcon,
} from './SocialIcons'

const Header = ({ blue }) => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)

    const NavLink = ({ children, title, path, newTab, desktop, className }) => {
        return (
            <Link
                className={`global-nav__link ${blue && 'global-nav__link--blue'
                    } ${className}`}
                href={path}
                title={title}
                target={newTab ? '_blank' : '_self'}
            >
                {children}
            </Link>
        )
    }

    return (
        <>
            <header className="global-header">
                <nav className="global-nav">
                    <ul className="global-nav__list">
                        <li className="global-nav__item global-nav__item--mobile">
                            <button
                                className="mobile-nav__toggle"
                                onClick={() => {
                                    setMobileNavOpen(!mobileNavOpen)
                                }}
                            >
                                <svg
                                    width="64"
                                    height="24"
                                    viewBox="0 0 64 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect width="64" height="24" fill="none" />
                                    <rect
                                        y="4"
                                        width="64"
                                        height="3"
                                        rx="1.5"
                                        fill={palettes.black[8].value}
                                    />
                                    <rect
                                        y="17"
                                        width="64"
                                        height="3"
                                        rx="1.5"
                                        fill={palettes.black[8].value}
                                    />
                                </svg>
                            </button>
                        </li>
                        <li className="global-nav__item global-nav__item--logo">
                            <NavLink title="John Livornese" path="/" className=" global-nav__logo-link--desktop">
                                <svg className="global-nav__logo--desktop" width="90" height="41" viewBox="0 0 90 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.125" width="89.75" height="41" rx="6" fill="currentcolor" style={{ fill: 'currentcolor' }} />
                                    <path d="M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z" fill="var(--caribbean-green-9)" />
                                    <path d="M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z" fill="var(--caribbean-green-9)" />
                                    <path d="M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z" fill="var(--caribbean-green-9)" />
                                </svg>
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Home" path="/" desktop>
                                Home
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Work" path="/work" desktop>
                                Work
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="About" path="/about" desktop>
                                About
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Contact" path="#contact" desktop>
                                Contact
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink
                                title="My Resume"
                                path="/John_L_Res_202312.pdf"
                                desktop
                            >
                                My Résumé
                            </NavLink>
                        </li>
                        <li className="global-nav__item">
                            <NavLink
                                title="John Livornese on LinkedIn"
                                path="https://www.linkedin.com/in/johnlivornese/"
                                newTab
                            >
                                <LinkedinIcon color="currentcolor" />
                            </NavLink>
                        </li>
                        {/* <li className="global-nav__item">
                            <NavLink
                                title="John Livornese on Threads"
                                path="https://threads.net/johnthedesigner/"
                                newTab
                            >
                                <ThreadsIcon color="currentcolor" />
                            </NavLink>
                        </li> */}
                        {/* <li className="global-nav__item">
                            <NavLink
                                title="John Livornese on Instagram"
                                path="https://www.instagram.com/johnthedesigner/"
                                newTab
                            >
                                <InstagramIcon color="currentcolor" />
                            </NavLink>
                        </li> */}
                    </ul>
                </nav>
            </header>
            {mobileNavOpen && (
                <nav
                    className="mobile-nav"
                    onClick={() => {
                        setMobileNavOpen(false)
                    }}
                >
                    <ul className="mobile-nav__list">
                        <li className="mobile-nav__item">
                            <NavLink title="Home" path="/" desktop>
                                Home
                            </NavLink>
                        </li>
                        <li className="mobile-nav__item">
                            <NavLink title="Work" path="/#work" desktop>
                                Work
                            </NavLink>
                        </li>
                        <li className="mobile-nav__item">
                            <NavLink title="About" path="/#about" desktop>
                                About
                            </NavLink>
                        </li>
                        <li className="mobile-nav__item">
                            <NavLink title="Contact" path="/#contact" desktop>
                                Contact
                            </NavLink>
                        </li>
                        <li className="mobile-nav__item">
                            <NavLink
                                title="Contact"
                                path="/John_L_Res_202312.pdf"
                                desktop
                            >
                                My Résumé
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            )}
        </>
    )
}

export default Header
