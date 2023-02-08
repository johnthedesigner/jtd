import Link from 'next/link'
import { palettes } from '../utils/colorUtils'

import { InstagramIcon, LinkedinIcon, TwitterIcon } from './SocialIcons'

const Header = ({ purple }) => {
    const NavLink = ({ children, title, path, newTab }) => {
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
                        <li className="global-nav__item">
                            <NavLink title="Home" path="/">
                                Home
                            </NavLink>
                        </li>
                        <li className="global-nav__item">
                            <NavLink title="Work" path="/#work">
                                Work
                            </NavLink>
                        </li>
                        <li className="global-nav__item">
                            <NavLink title="Contact" path="/#contact">
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
        </>
    )
}

export default Header
