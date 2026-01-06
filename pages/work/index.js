import SimpleHeader from '../../components/SimpleHeader';
import WorkItem from '../../components/WorkItem';
import caseStudies from '../../utils/caseStudies';

export default function WorkIndex() {
    return (
        <>
            <SimpleHeader title="Case Studies" />
            <main style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="work-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6rem', width: '50rem', maxWidth: '90vw', margin: '0 auto' }}>
                        {caseStudies.map((page, index) => (
                            <WorkItem key={index} item={page} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}