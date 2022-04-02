import { useState } from 'react'
import Link from 'next/link'
import { palettes } from '../utils/colorUtils'

const teal = palettes.blue[3]
const darkGray = palettes.grayscale[8]

const Header = ({ route }) => {
    const [displayNav, setDisplayNav] = useState(false)
    const [hoverMenu, setHoverMenu] = useState(false)

    const Logo = () => {
        const [hover, setHover] = useState()
        // let jColor = '#60D8FE'
        // let tColor = '#FF7E76'
        // let dColor = '#FFC960'
        let jColor = hover ? palettes.purple[3] : darkGray
        let tColor = hover ? palettes.purple[3] : darkGray
        let dColor = hover ? palettes.purple[3] : darkGray

        return (
            <span
                onMouseOver={() => setHover(true)}
                onMouseOut={() => setHover(false)}
            >
                <svg
                    className="global-header__logo"
                    width="120"
                    height="36"
                    viewBox="0 0 120 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M42 0H60V18H42V0ZM60 0H78V18H60V0ZM69 18H51V36H69V18Z"
                        fill={jColor}
                        style={{ pointerEvents: 'none' }}
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M102 0C111.941 0 120 8.05887 120 18C120 27.9411 111.941 35.9999 102 35.9999V18L102 0ZM102 1.3113e-05H84V18V36H102V18V1.3113e-05Z"
                        fill={tColor}
                        style={{ pointerEvents: 'none' }}
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M18 0H36V17.9999V18C36 27.9411 27.9411 35.9999 18 35.9999V18V17.9999V0ZM18 36C8.05887 36 0 27.9411 0 18H18V36Z"
                        fill={dColor}
                        style={{ pointerEvents: 'none' }}
                    />
                </svg>
            </span>
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

    const TwitterIcon = () => {
        return (
            <svg
                className="social-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g clipPath="url(#clip0_138_6716)">
                    <path
                        d="M24 4.55699C23.117 4.94899 22.168 5.21299 21.172 5.33199C22.189 4.72299 22.97 3.75799 23.337 2.60799C22.386 3.17199 21.332 3.58199 20.21 3.80299C19.313 2.84599 18.032 2.24799 16.616 2.24799C13.437 2.24799 11.101 5.21399 11.819 8.29299C7.728 8.08799 4.1 6.12799 1.671 3.14899C0.381 5.36199 1.002 8.25699 3.194 9.72299C2.388 9.69699 1.628 9.47599 0.965 9.10699C0.911 11.388 2.546 13.522 4.914 13.997C4.221 14.185 3.462 14.229 2.69 14.081C3.316 16.037 5.134 17.46 7.29 17.5C5.22 19.123 2.612 19.848 0 19.54C2.179 20.937 4.768 21.752 7.548 21.752C16.69 21.752 21.855 14.031 21.543 7.10599C22.505 6.41099 23.34 5.54399 24 4.55699V4.55699Z"
                        fill="currentColor"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_138_6716">
                        <rect width="24" height="24" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        )
    }

    const LinkedinIcon = () => {
        return (
            <svg
                className="social-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M19 0H5C2.239 0 0 2.239 0 5V19C0 21.761 2.239 24 5 24H19C21.762 24 24 21.761 24 19V5C24 2.239 21.762 0 19 0ZM8 19H5V8H8V19ZM6.5 6.732C5.534 6.732 4.75 5.942 4.75 4.968C4.75 3.994 5.534 3.204 6.5 3.204C7.466 3.204 8.25 3.994 8.25 4.968C8.25 5.942 7.467 6.732 6.5 6.732ZM20 19H17V13.396C17 10.028 13 10.283 13 13.396V19H10V8H13V9.765C14.396 7.179 20 6.988 20 12.241V19Z"
                    fill="currentColor"
                />
            </svg>
        )
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
                    <MenuButton active={hoverMenu || displayNav} />{' '}
                    <span className="global-header__menu-text">Menu</span>
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
                                <Link href="/">
                                    <a className="global-nav__link">Home</a>
                                </Link>
                                <BlinkingCursor linkPath={'/'} />
                            </li>
                            <li className="global-nav__menu-item">
                                <Link href="/work">
                                    <a className="global-nav__link">Work</a>
                                </Link>
                                <BlinkingCursor linkPath={'/work'} />
                            </li>
                            <li className="global-nav__menu-item">
                                <Link href="/about">
                                    <a className="global-nav__link">About</a>
                                </Link>
                                <BlinkingCursor linkPath={'/about'} />
                            </li>
                            <li className="global-nav__social-icons">
                                <a
                                    href="https://twitter.com/whatwouldjohndo"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="global-nav__social-link"
                                >
                                    <TwitterIcon />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/johnlivornese/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="global-nav__social-link"
                                >
                                    <LinkedinIcon />
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </>
    )
}

export default Header
