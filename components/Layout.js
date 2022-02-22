import Head from 'next/head'
import { useRouter } from 'next/router'

import Header from './Header'

const Layout = ({ children }) => {
    const { route } = useRouter()
    return (
        <div>
            <Head>
                <title>John the Designer</title>
                <meta
                    name="description"
                    content="Product designer from the Boston area."
                />
                <link rel="icon" href="/favicon.ico" />
                <link
                    href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,700,700i,900,900i|IBM+Plex+Mono:200,200i,400,400i&family=Work+Sans:ital,wght@0,400;0,700;1,400;1,700"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
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
        </div>
    )
}

export default Layout
