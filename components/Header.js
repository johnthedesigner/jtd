import { useState } from 'react'
import Link from 'next/link'
import { palettes } from '../utils/colorUtils'

const teal = palettes.blue[3]
const darkGray = palettes.grayscale[9]

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
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="24"
                    cy="24"
                    r="24"
                    fill={active ? palettes.grayscale[9] : palettes.purple[4]}
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.4299 23.9362C11.1924 23.4376 11.4042 22.8409 11.9028 22.6034L29.0672 14.4299C29.5658 14.1925 30.1626 14.4042 30.4 14.9028C30.6374 15.4015 30.4257 15.9982 29.9271 16.2356L12.7627 24.4092C12.2641 24.6466 11.6673 24.4349 11.4299 23.9362ZM14.4316 28.4386C14.1942 27.94 14.4059 27.3433 14.9045 27.1058L32.0689 18.9323C32.5676 18.6949 33.1643 18.9066 33.4017 19.4052C33.6392 19.9039 33.4274 20.5006 32.9288 20.738L15.7644 28.9115C15.2658 29.149 14.669 28.9373 14.4316 28.4386ZM17.906 31.6082C17.4074 31.8456 17.1956 32.4424 17.4331 32.941C17.6705 33.4396 18.2672 33.6514 18.7659 33.4139L35.9303 25.2404C36.4289 25.003 36.6406 24.4062 36.4032 23.9076C36.1657 23.409 35.569 23.1972 35.0704 23.4347L17.906 31.6082Z"
                    fill={active ? palettes.grayscale[0] : palettes.purple[9]}
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
