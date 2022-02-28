import Head from 'next/head'
import { useRouter } from 'next/router'

import Header from './Header'

const Layout = ({ children }) => {
    const { route } = useRouter()
    return (
        <>
            <Head>
                <title>John the Designer</title>
                <meta
                    name="description"
                    content="Product designer from the Boston area."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                ></meta>
                <link rel="icon" href="/favicon.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossorigin
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Source+Sans+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Taviraj:ital,wght@0,400;0,700;1,400;1,700&display=swap"
                    rel="stylesheet"
                />
                <script
                    async
                    src={`https://www.googletagmanager.com/gtag/js?id=UA-18588101-1`}
                />
                <script
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
            </Head>

            <Header route={route} />

            {children}
        </>
    )
}

export default Layout
