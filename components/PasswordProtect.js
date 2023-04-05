import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import WiggleButton from './WiggleButton'
import WorkHeader from './WorkHeader'

// Look into the cookies to find password and see if it matches
export const checkAuthentication = (ctx, cookieName, envVar) => {
    const parseCookie = (str) =>
        str
            .split(';')
            .map((v) => v.split('='))
            .reduce((acc, v) => {
                acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(
                    v[1].trim()
                )
                return acc
            }, {})

    // Get password from env variables
    let password = process.env[envVar]
    // Get password from user cookie (if there is one)
    let cookiePassword = parseCookie(ctx.req.headers.cookie)[cookieName]
    // Check that both passwords match
    let authenticated = password === cookiePassword

    console.log(
        `Env Password: ${password}`,
        `Cookie Password: ${cookiePassword}`
    )
    // Return false if there is a logout=true query param
    if (ctx.query.logout === 'true') {
        authenticated = false
    }

    return authenticated
}

// Only show wrapped content if authenticated=true
const PasswordProtect = ({ authenticated, cookieName, children }) => {
    const [cookies, setCookie] = useCookies([cookieName])
    const router = useRouter()
    const passwordFieldRef = useRef(null)

    const handlePassword = (e) => {
        console.log('called handlePassword()')
        e.preventDefault()

        let password = e.target.password.value
        setCookie(cookieName, password, { path: '/' })
        console.log('cookie set')
        router.reload() // Trigger a page reload to check for a good password
    }

    useEffect(() => {
        if (passwordFieldRef.current) {
            passwordFieldRef.current.select()
        }

        // If authenticated=false unset current password to allow for logout
        if (!authenticated) {
            console.log('negate cookie')
            setCookie(cookieName, '', { path: '/' })
        }
    }, [authenticated, cookieName, setCookie])

    if (authenticated) {
        return <>{children}</>
    } else {
        return (
            <>
                <WorkHeader superHead="Design Foundation" />
                <div className="password-protect">
                    <h2 className="password-protect__title">
                        This Page is Password Protected
                    </h2>
                    <p className="password-protect__subtitle">
                        <Link href="/#contact">Get in touch</Link> for access.
                    </p>
                    <form onSubmit={handlePassword}>
                        <input
                            className="password-protect__password-input"
                            type="password"
                            name="password"
                            ref={passwordFieldRef}
                        />
                        <WiggleButton style={{ margin: '2rem auto' }}>
                            Submit
                        </WiggleButton>
                    </form>
                </div>
            </>
        )
    }
}

export default PasswordProtect
