import Head from 'next/head'
import dynamic from 'next/dynamic'

// WebGL needs a window, and the three/R3F bundle should not travel with any
// other page, so the viewer is client-only and split out.
const CourtViewer = dynamic(
    () => import('../../components/nba-court/CourtViewer'),
    { ssr: false }
)

export default function NbaCourtPage() {
    return (
        <>
            <Head>
                <title>NBA courts — experiment</title>
                <meta
                    name="description"
                    content="An arena floor under house lights, rendered in WebGL."
                />
            </Head>
            <main style={{ height: '100dvh', width: '100%', background: '#0b0d12' }}>
                <CourtViewer />
            </main>
        </>
    )
}
