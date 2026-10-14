/**
 * Side projects that live on this site rather than linking out.
 *
 * Deliberately a flat list, the way `caseStudies` is: the homepage shows
 * whichever one is marked `homepage`, and `/experiments` shows all of them.
 * Anything without a `thumbnail` renders as a text-only card, so adding one
 * never requires producing art first.
 *
 * Only Courtside is listed for now. The logo-hero and pomodoro pages still
 * exist and still work at their own URLs; they are simply not presented as
 * finished pieces yet, and a listing of one good thing reads better than a
 * listing of one good thing and two sketches.
 */
/**
 * The section's own summary, shown above the list on `/experiments` and
 * beside the single featured card on the homepage. One string, because two
 * copies of the same sentence drift the first time either is edited.
 */
export const EXPERIMENTS_BLURB =
    'Self-directed projects built to answer a question rather than a brief \u2014 usually about how something could feel to use. It\u2019s where I try things out before they show up in client work.'

const experiments = [
    {
        homepage: true,
        title: 'Courtside',
        subtitle: 'An NBA game, rendered',
        description:
            'A real NBA floor drawn in WebGL, with realistic reflections and textures. Pick a game and watch the live feed of events play out in real-time — shots, rebounds and steals light up the court where they happen, the live score towers over the court. Don\u2019t forget to watch until the end to celebrate with the winning team.',
        href: '/experiments/courtside',
        thumbnail: '/experiments/courtside-thumb.webp',
        // Framed for cropping: roughly square, with margin around the
        // lockup so a narrow panel can bite into it without clipping.
        thumbnailFit: 'cover',
        thumbnailAlt:
            'The JTD Courtside lockup standing in lit letters behind a Boston Celtics court rendered in 3D under arena lights',
    },
]

export default experiments
