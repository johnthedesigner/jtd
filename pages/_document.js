import Document, { Html, Head, Main, NextScript } from 'next/document'

const MyDocument = () => {
    return (
        <Html lang="en">
            <Head>
                {/*
                  The viewport meta lives in `_app`, not here: Next warns
                  about it in `_document` because `_document` renders once on
                  the server and a page cannot then override it. It also
                  needs `viewport-fit=cover`, without which `env(safe-area-
                  inset-*)` is always zero and a full-bleed page cannot reach
                  under a notch or a home indicator.
                */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossorigin
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;0,1000;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900;1,1000&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body style={{ margin: 0, padding: 0 }}>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

export default MyDocument
