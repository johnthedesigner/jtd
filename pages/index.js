import _ from 'lodash'
import Head from 'next/head'

import ArtboardContainer from '../components/ArtboardContainer'
import Layout from '../components/Layout'

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <link rel="icon" href="/favicon.ico" />
                <link
                    href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,700,700i,900,900i|IBM+Plex+Mono:200,200i,400,400i"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                    rel="stylesheet"
                />
            </Head>

            <ArtboardContainer />
        </Layout>
    )
}
