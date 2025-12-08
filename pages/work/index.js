import Link from 'next/link';

import SimpleHeader from '../../components/SimpleHeader';
import WorkItem from '../../components/WorkItem';
import { palettes } from '../../utils/colorUtils';

const workPages = [
    {
        company: 'Luminoso',
        title: 'Answers First',
        description: 'Eliminating “Analysis Paralysis” with automatic text analytics',
        href: '/work/answers-first',
        color1: 'caribbean-green',
        color2: 'navy-blue',
    },
    {
        company: 'Luminoso',
        title: 'Great Design System Color Tokens',
        description: 'Building an app to generate the color tokens a design system really needs',
        href: '/work/colors',
        color1: 'blue',
        color2: 'sunset-red',
    },
    {
        company: 'Salesforce',
        title: 'Tableau Scenario Planner',
        description: 'Designing a new product @ Tableau that brings data to life',
        href: '/work/scenario-planning',
        color1: 'purple-heart',
        color2: 'robins-egg-blue',
    },
    {
        company: 'ACME',
        title: 'Project Gamma',
        description: 'Details about Project Gamma.',
        href: '/work/gamma',
        color1: 'caribbean-green',
        color2: 'navy-blue',
    },
    // Add more projects as needed
];

export default function WorkIndex() {
    return (
        <>
            <SimpleHeader title="My Work" />
            <main style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="work-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2rem', width: '50rem', margin: '0 auto' }}>
                        {workPages.slice(1).map((page) => (
                            <WorkItem color1={palettes[page.color1]} color2={palettes[page.color2]} item={{ company: page.company, title: page.title, description: page.description, href: page.href }} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}