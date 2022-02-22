import _ from 'lodash'
import Head from 'next/head'

import ArtboardContainer from '../components/ArtboardContainer'
import Layout from '../components/Layout'

const title = 'John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'This is my "personal website", but you know, not too personal. Check out my work, or get in touch and we can talk product design, engineering or Celtics basketball.'

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
            </Head>
            <ArtboardContainer />
        </Layout>
    )
}
