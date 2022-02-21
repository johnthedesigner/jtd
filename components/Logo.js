import { useState } from 'react'

const Logo = () => {
    const [hover, setHover] = useState()
    // let jColor = '#60D8FE'
    // let tColor = '#FF7E76'
    // let dColor = '#FFC960'
    let jColor = hover ? 'rgb(42, 245, 152)' : '#222'
    let tColor = hover ? 'rgb(42, 245, 152)' : '#222'
    let dColor = hover ? 'rgb(42, 245, 152)' : '#222'

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

export default Logo
