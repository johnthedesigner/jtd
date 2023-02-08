import Link from 'next/link'
import { useState } from 'react'
import { palettes } from '../utils/colorUtils'

import { InstagramIcon, LinkedinIcon, TwitterIcon } from './SocialIcons'

const Header = ({ purple }) => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)

    const NavLink = ({ children, title, path, newTab, desktop }) => {
        return (
            <Link
                className={`global-nav__link ${
                    purple && 'global-nav__link--purple'
                }`}
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
                                        fill={palettes.grayscale[8]}
                                    />
                                    <rect
                                        y="17"
                                        width="64"
                                        height="3"
                                        rx="1.5"
                                        fill={palettes.grayscale[8]}
                                    />
                                </svg>
                            </button>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Home" path="/" desktop>
                                Home
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Work" path="/#work" desktop>
                                Work
                            </NavLink>
                        </li>
                        <li className="global-nav__item global-nav__item--desktop">
                            <NavLink title="Contact" path="/#contact" desktop>
                                Contact
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
                        <li className="global-nav__item">
                            <NavLink
                                title="John Livornese on Twitter"
                                path="https://twitter.com/whatwouldjohndo/"
                                newTab
                            >
                                <TwitterIcon color="currentcolor" />
                            </NavLink>
                        </li>
                        <li className="global-nav__item">
                            <NavLink
                                title="John Livornese on Instagram"
                                path="https://www.instagram.com/johnthedesigner/"
                                newTab
                            >
                                <InstagramIcon color="currentcolor" />
                            </NavLink>
                        </li>
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
                            <NavLink title="Contact" path="/#contact" desktop>
                                Contact
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            )}
        </>
    )
}

export default Header
