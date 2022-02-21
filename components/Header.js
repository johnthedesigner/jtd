import { useState } from 'react'
import Link from 'next/link'

const teal = 'rgb(42, 245, 152)'
const darkGray = '#222'

const Header = ({ route }) => {
    const [displayNav, setDisplayNav] = useState(false)
    const [hoverMenu, setHoverMenu] = useState(false)

    const Logo = () => {
        const [hover, setHover] = useState()
        // let jColor = '#60D8FE'
        // let tColor = '#FF7E76'
        // let dColor = '#FFC960'
        let jColor = hover ? teal : darkGray
        let tColor = hover ? teal : darkGray
        let dColor = hover ? teal : darkGray

        return (
            <svg
                className="global-header__logo"
                width="120"
                height="36"
                viewBox="0 0 120 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onMouseOver={() => setHover(true)}
                onMouseOut={() => setHover(false)}
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M42 0H60V18H42V0ZM60 0H78V18H60V0ZM69 18H51V36H69V18Z"
                    fill={jColor}
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M102 0C111.941 0 120 8.05887 120 18C120 27.9411 111.941 35.9999 102 35.9999V18L102 0ZM102 1.3113e-05H84V18V36H102V18V1.3113e-05Z"
                    fill={tColor}
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18 0H36V17.9999V18C36 27.9411 27.9411 35.9999 18 35.9999V18V17.9999V0ZM18 36C8.05887 36 0 27.9411 0 18H18V36Z"
                    fill={dColor}
                />
            </svg>
        )
    }

    const MenuButton = ({ active }) => {
        const menuButtonStyles = { transition: 'all linear .1s' }
        return (
            <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={menuButtonStyles}
            >
                <circle cx="18" cy="18" r="18" fill={active ? teal : 'white'} />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.35504 17.6457C0.998875 16.8977 1.31648 16.0027 2.06443 15.6465L24.6359 4.89816C25.3839 4.542 26.279 4.8596 26.6351 5.60756C26.9913 6.35551 26.6737 7.25058 25.9257 7.60675L3.35423 18.3551C2.60628 18.7113 1.71121 18.3937 1.35504 17.6457ZM5.35504 23.6457C4.99887 22.8977 5.31648 22.0027 6.06443 21.6465L28.6359 10.8982C29.3839 10.542 30.279 10.8596 30.6351 11.6076C30.9913 12.3555 30.6737 13.2506 29.9257 13.6067L7.35423 24.3551C6.60628 24.7113 5.71121 24.3937 5.35504 23.6457ZM10.0644 27.6465C9.31648 28.0027 8.99887 28.8977 9.35504 29.6457C9.71121 30.3937 10.6063 30.7113 11.3542 30.3551L33.9257 19.6067C34.6737 19.2506 34.9913 18.3555 34.6351 17.6076C34.279 16.8596 33.3839 16.542 32.6359 16.8982L10.0644 27.6465Z"
                    fill={active ? darkGray : darkGray}
                />
            </svg>
        )
    }

    const BlinkingCursor = ({ linkPath }) => {
        if (route === linkPath) {
            return <span className="blinking-cursor">|</span>
        } else {
            return null
        }
    }

    return (
        <>
            <header className="global-header">
                <button
                    className="global-header__menu-button"
                    onClick={() => setDisplayNav(!displayNav)}
                    onMouseOver={() => setHoverMenu(true)}
                    onMouseOut={() => setHoverMenu(false)}
                >
                    <MenuButton active={hoverMenu || displayNav} />
                </button>
                <Link href="/" passHref={true}>
                    <button className="global-header__home-button">
                        <Logo />
                    </button>
                </Link>
            </header>

            {displayNav && (
                <div
                    className="global-nav"
                    onClick={() => setDisplayNav(false)}
                >
                    <nav className="global-nav__menu">
                        <ul className="global-nav__menu-list">
                            <li className="global-nav__menu-item">
                                <Link href="/">Home</Link>
                                <BlinkingCursor linkPath={'/'} />
                            </li>
                            <li className="global-nav__menu-item">
                                <Link href="/work">Work</Link>
                                <BlinkingCursor linkPath={'/work'} />
                            </li>
                            <li className="global-nav__menu-item">
                                <Link href="/about">About</Link>
                                <BlinkingCursor linkPath={'/about'} />
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </>
    )
}

export default Header
