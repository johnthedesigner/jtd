import Layout from '../../components/Layout'
import Link from 'next/link'

const Work = () => {
    return (
        <Layout>
            <div className="text-container">
                <h3 className="page-title">Some of my recent work</h3>
                <div className="table-of-contents__item">
                    <span className="table-of-contents__name">
                        1. The Highlights Page
                    </span>
                    <Link href="/work/highlights">
                        <a className="table-of-contents__link">
                            The cornerstone of our UI
                        </a>
                    </Link>
                </div>
                <div className="table-of-contents__item">
                    <span className="table-of-contents__name">
                        2. &quot;Answers First&quot;
                    </span>
                    <Link href="/work/answers-first">
                        <a className="table-of-contents__link">
                            What does that mean?
                        </a>
                    </Link>
                </div>
                <div className="table-of-contents__item">
                    <span className="table-of-contents__name">
                        3. Improving the Analysis Workflow
                    </span>
                    <Link href="/work/workflow">
                        <a className="table-of-contents__link">
                            No more analysis paralysis
                        </a>
                    </Link>
                </div>
                <div className="table-of-contents__item">
                    <span className="table-of-contents__name">
                        4. Comparing time periods
                    </span>
                    <Link href="/work/comparisons">
                        <a className="table-of-contents__link">
                            What even happened last week?
                        </a>
                    </Link>
                </div>
                <div className="table-of-contents__item">
                    <span className="table-of-contents__name">
                        4. Filtering documents
                    </span>
                    <Link href="/work/filtering">
                        <a className="table-of-contents__link">
                            Faceted search FTW
                        </a>
                    </Link>
                </div>
            </div>
        </Layout>
    )
}

export default Work
