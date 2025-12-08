import { useRouter } from 'next/router'
import { useState } from 'react'
import Script from 'next/script'
import { useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import '../styles/globals.css'
import * as gtag from '../utils/gtag'
import { Analytics } from '@vercel/analytics/react'

import { PasswordProvider } from '../utils/context'
import Layout from '../components/Layout'

function MyApp({ Component, pageProps }) {
    // Password Protecting Case Studies
    const [authLoading, setAuthLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [passwordError, setPasswordError] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const password = 'gottaseeit'
    const handlePassword = (tryPassword) => {
        const inputPassword = tryPassword
        if (inputPassword === password) {
            setAuthenticated(true)
            setAuthLoading(false)
            setPasswordError(false)
            localStorage.setItem('authenticated', JSON.stringify(true))
        } else {
            setAuthLoading(false)
            setAuthenticated(false)
            localStorage.setItem('authenticated', JSON.stringify(false))
            setPasswordError(true)
            // setTimeout(() => { // Uncomment if you want to clear the error after a delay
            //     setPasswordError(false)
            // }, 3000)
        }
    }
    // Logout function
    const logout = () => {
        console.log('Logging out...')
        setAuthenticated(false)
        setAuthLoading(false)
        localStorage.setItem('authenticated', JSON.stringify(false))
        setPasswordError(false)
        console.log('Logged out, authenticated state:', authenticated)
    }
    // get and set authenticated in local storage
    useEffect(() => {
        console.log('Checking local storage for authenticated state...')
        const storedAuth = localStorage.getItem('authenticated')
        if (storedAuth) {
            console.log('Found authenticated state in local storage:', storedAuth)
            setAuthenticated(JSON.parse(storedAuth))
        } else {
            logout()
            console.log('No authenticated state found in local storage, setting to false')
        }
    }, [])

    const router = useRouter()

    useEffect(() => {
        const handleRouteChange = (url) => {
            gtag.pageview(url)
        }
        router.events.on('routeChangeComplete', handleRouteChange)
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [router.events])

    return (
        <>
            <Script
                strategy="afterInteractive"
                src="https://www.googletagmanager.com/gtag/js?id=G-3FS5NPTT0B"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-3FS5NPTT0B');
                `}
            </Script>
            {/* <Theme grayColor='gray' hasBackground={false} accentColor='#0069F0' radius="large" scaling="95%"> */}
            <CookiesProvider>
                <PasswordProvider.Provider value={{ authLoading, authenticated, passwordError, dialogOpen, setDialogOpen, handlePassword, logout }}>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </PasswordProvider.Provider>
                <Analytics />
            </CookiesProvider>
            {/* <ThemePanel /> */}
            {/* </Theme> */}
        </>
    )
}

export default MyApp
