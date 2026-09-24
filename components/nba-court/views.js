/**
 * Views: a viewpoint and an overlay chosen together.
 *
 * Picking a visualisation and then separately picking a camera angle makes the
 * viewer do work the scene should already know how to do — every chart has an
 * angle it reads best from, and the light-column map is meaningless from
 * directly overhead where its heights collapse. So a view owns both, and
 * selecting one moves the camera and brings its overlay in as a single act.
 */
export const VIEWS = {
    court: {
        id: 'court',
        label: 'Court',
        pose: 'wide',
        overlay: null,
        courtDim: 1,
    },
    ball: {
        id: 'ball',
        label: 'Ball',
        pose: 'ball',
        overlay: null,
        courtDim: 1,
    },
    basket: {
        id: 'basket',
        label: 'Basket',
        pose: 'hoop',
        overlay: null,
        courtDim: 1,
    },
    shots: {
        id: 'shots',
        label: 'Shot map',
        pose: 'shots',
        overlay: 'shots',
        // Additive light cannot compete with lit hardwood, so the house lights
        // come down as the chart comes up.
        courtDim: 0.75,
        legend: 'Height = attempts · Colour = points per shot vs league',
    },
    overhead: {
        id: 'overhead',
        label: 'Overhead',
        pose: 'overhead',
        overlay: null,
        courtDim: 1,
    },
    dfence: {
        id: 'dfence',
        label: 'D-Fence',
        pose: 'dfence',
        overlay: 'dfence',
        courtDim: 1,
    },
    celebration: {
        id: 'celebration',
        label: 'Celebrate',
        pose: 'celebration',
        overlay: 'celebration',
        courtDim: 1,
    },
    live: {
        id: 'live',
        label: 'Live',
        // The idle/base pose while nothing notable is happening — reuses
        // 'wide' rather than a new near-duplicate pose, matching how a live
        // scene should settle back to "the standard half-court view"
        // between events, not a bespoke live-only establishing shot.
        pose: 'wide',
        overlay: 'live',
        courtDim: 1,
    },
}

export const VIEW_ORDER = ['court', 'ball', 'basket', 'shots', 'overhead', 'dfence', 'celebration', 'live']
