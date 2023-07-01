import { useRouter } from 'next/router'
import Script from 'next/script'
import { useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import '../styles/globals.css'
import * as gtag from '../utils/gtag'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }) {
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
                src="https://www.googletagmanager.com/gtag/js?id=UA-18588101-1"
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-18588101-1', {
            page_path: window.location.pathname,
            });
            `,
                }}
            />
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
                <Component {...pageProps} />
                <Analytics />
            </CookiesProvider>
        </>
    )
}

export default MyApp
