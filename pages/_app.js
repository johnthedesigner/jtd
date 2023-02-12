import Script from 'next/script'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
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
            <Component {...pageProps} />
        </>
    )
}

export default MyApp
