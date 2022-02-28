import Layout from '../../components/Layout'
import Link from 'next/link'
import Head from 'next/head'
import _ from 'lodash'

const title =
    'Recent Work | John the Designer – Boston-Area Product Designer John Livornese'
const description = 'Some of my recent work in a product design role'

const Work = () => {
    const WorkItem = ({ workItem, index }) => {
        const { name, caption, path, enabled } = workItem
        return (
            <div className="table-of-contents__item">
                <span className="table-of-contents__name">
                    {index + 1}. {name}
                </span>
                <Link href={path}>
                    <a className="table-of-contents__link">{caption}</a>
                </Link>
            </div>
        )
    }

    const workItems = [
        {
            name: 'The Highlights Page',
            caption: 'The cornerstone of our UI',
            path: '/work/highlights',
            enabled: true,
        },
        {
            name: 'Answers First',
            caption: 'What does that mean?',
            path: '/work/answers-first',
            enabled: true,
        },
        {
            name: 'Making great color palettes',
            caption: 'Which blue should I use?',
            path: '/work/colors',
            enabled: true,
        },
        {
            name: 'Improving the Analysis Workflow',
            caption: 'No more analysis paralysis',
            path: '/work/workflow',
            enabled: false,
        },
        {
            name: 'Comparing time periods',
            caption: 'What even happened last week?',
            path: '/work/comparisons',
            enabled: true,
        },
        {
            name: 'Filtering documents',
            caption: 'Faceted search FTW',
            path: '/work/filtering',
            enabled: false,
        },
    ]

    return (
        <main className="work-page">
            <Layout>
                <Head>
                    <title>{title}</title>
                    <meta property="og:title" content={title} key="title" />
                    <meta name="description" content={description} />
                </Head>
                <div className="text-container">
                    <h3 className="page-title">Some of my recent work</h3>
                    {_.map(
                        _.filter(workItems, { enabled: true }),
                        (workItem, index) => {
                            return (
                                <WorkItem
                                    workItem={workItem}
                                    index={index}
                                    key={index}
                                />
                            )
                        }
                    )}
                </div>
            </Layout>
        </main>
    )
}

export default Work
