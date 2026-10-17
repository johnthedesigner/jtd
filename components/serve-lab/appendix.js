/**
 * What this is made of, and what is and is not measured.
 *
 * This used to be a badge on every chapter reading MEASURED or SIMULATED.
 * That put a disclaimer in front of the reader eight times to answer a
 * question they ask once, and it made the distinction look like a caveat
 * rather than what it is — the reason the page is worth making. It lives
 * here now, in one place, where it can be said properly and with sources.
 */
export const APPENDIX = {
    title: 'About this',
    sections: [
        {
            heading: 'The capture',
            body:
                'One right-handed player, flat serves from the deuce side, recorded by ' +
                'eight optical cameras at 180 frames a second. Joint centres are solved ' +
                'from the motion rather than guessed from marker positions, which holds ' +
                'bone lengths steady to within a few millimetres across the whole swing.',
        },
        {
            heading: 'What is measured',
            body:
                'Every body position, angle and speed on this page: the joints, the ' +
                'racket, the timings, the knee and elbow angles, the hip and shoulder ' +
                'lines. Contact is found from the sudden drop in racket speed as the ' +
                'ball meets the strings, which places it to within about three ' +
                'thousandths of a second.',
        },
        {
            heading: 'What is not',
            body:
                'No ball was tracked. The toss, the flight and the bounce are simulated: ' +
                'fitted to the tossing hand’s measured velocity, solved to pass through ' +
                'the measured contact point, and landing where the lab recorded this ' +
                'serve going. They are built to look physically right, not to be ' +
                'evidence. The follow-through past the end of the clip is extrapolated ' +
                'from measured momentum, and the court placement is reconstructed, since ' +
                'the lab recorded no court.',
        },
        {
            heading: 'Checked against published work',
            body:
                'Contact height, racket speed, knee bend and shoulder turn across the ' +
                'clean serves in this dataset all sit inside the ranges reported in the ' +
                'literature. Elbow extension at contact runs straighter than the ' +
                'published mean and trunk lean more upright, which may be partly a ' +
                'difference in how each is defined.',
        },
    ],
    links: [
        {
            label: 'Dataset — University of Bath Research Data Archive',
            href: 'https://doi.org/10.15125/BATH-01454',
        },
        {
            label: 'Paper — Predicting the Outcome of Tennis Serves Using Motion Capture and Deep Learning',
            href: 'https://doi.org/10.3390/make7040118',
        },
        {
            label: 'Review — Jacquier-Bret and Gorce, serve kinematics across 27 studies',
            href: 'https://www.frontiersin.org/articles/10.3389/fspor.2024.1432030/full',
        },
    ],
    credit:
        'Data: Durlind, Martinez-Hernandez and Assaf (2025), University of Bath ' +
        'Research Data Archive. Used under CC BY 4.0.',
}
