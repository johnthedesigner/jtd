import { useRouter } from 'next/router'
import { useState } from 'react'
import Script from 'next/script'
import { useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import '../styles/globals.css'
import * as gtag from '../utils/gtag'
import { Analytics } from '@vercel/analytics/react'

import localFont from 'next/font/local'
import { Fraunces, Nunito_Sans } from 'next/font/google'

import { PasswordProvider } from '../utils/context'
import Layout from '../components/Layout'
import AuthNotice from '../components/AuthNotice'

const schmaltzy = localFont({
    src: '../public/fonts/Schmaltzy-VF.ttf',
    variable: '--font-schmaltzy',
    display: 'swap',
})

const fraunces = Fraunces({
    subsets: ['latin'],
    axes: ['opsz', 'SOFT'],
    variable: '--font-fraunces',
    display: 'swap',
})

const nunitoSans = Nunito_Sans({
    subsets: ['latin'],
    variable: '--font-nunito-sans',
    display: 'swap',
})

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
        }
    }
    const logout = () => {
        setAuthenticated(false)
        setAuthLoading(false)
        localStorage.setItem('authenticated', JSON.stringify(false))
        setPasswordError(false)
    }
    useEffect(() => {
        const storedAuth = localStorage.getItem('authenticated')
        if (storedAuth) {
            setAuthenticated(JSON.parse(storedAuth))
        } else {
            logout()
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

    const isDesignRoute = router.pathname.startsWith('/design')

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
            <CookiesProvider>
                <PasswordProvider.Provider value={{ authLoading, authenticated, passwordError, dialogOpen, setDialogOpen, handlePassword, logout }}>
                    <div className={`${schmaltzy.variable} ${fraunces.variable} ${nunitoSans.variable}`} style={{ fontVariationSettings: "'SOFT' 50" }}>
                        {isDesignRoute ? (
                            <Component {...pageProps} />
                        ) : (
                            <>
                                {authenticated && <AuthNotice />}
                                <Layout>
                                    <Component {...pageProps} />
                                </Layout>
                            </>
                        )}
                    </div>
                </PasswordProvider.Provider>
                <Analytics />
            </CookiesProvider>
        </>
    )
}

export default MyApp
