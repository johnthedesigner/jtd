/**
 * The narrative.
 *
 * This replaced a list of the serve's ten moments in order, which is a
 * timeline rather than an argument. Each chapter here makes one claim,
 * stages the part of the serve that shows it, and carries the measurement
 * that proves it.
 *
 * **Every number below was pulled from serve 57 before the copy was
 * written**, not after. That matters more than usual here: most of what is
 * said about serves is received rather than measured, and two of the things
 * this page now says contradict the usual telling. The racket drop turns
 * out to be an elbow fold rather than the arm being pulled back, and
 * hip-shoulder separation is not held through the trophy position and then
 * unwound — it is created almost entirely inside the last fifty
 * milliseconds.
 *
 * The through-line: **a serve is a chain, not a pose.** Everything coached
 * as a position is a consequence of timing, and the whole thing resolves
 * into about five milliseconds.
 */

export const PROVENANCE = {
    measured: { label: 'Measured', detail: 'Taken from the motion capture.' },
    estimated: { label: 'Estimated', detail: 'Inferred from the capture, not recorded directly.' },
    simulated: { label: 'Simulated', detail: 'Physics, not data. Built to look right, not to be evidence.' },
}

export const READOUTS = {
    elbow: { label: 'Elbow', unit: '°', series: 'elbow', digits: 0 },
    knee: { label: 'Front knee', unit: '°', series: 'knee', digits: 0 },
    sep: { label: 'Hips to shoulders', unit: '°', series: 'sep', digits: 0, absolute: true },
}

export const INTRO = {
    title: 'Serve Lab',
    body:
        'One professional serve, recorded by eight cameras at 180 frames a ' +
        'second and rebuilt here in 3D. Everything you are about to see is ' +
        'measured from that recording. Most of it happens far too fast to ' +
        'watch.',
    camera: 'above',
}

/*
  Imperial, because the audience is.

  The capture is metric and stays metric everywhere it is computed; the
  conversions happen here, at the last possible moment, so nothing upstream
  ever carries a number in units it was not measured in.
*/
const MPH_PER_MS = 2.23694
const MPH_PER_KMH = 0.621371
const mph = (metresPerSecond) => Math.round(metresPerSecond * MPH_PER_MS)
const inches = (metres) => Math.round(metres * 39.3701)
/** Feet and inches, the way a height is said out loud. */
const feetInches = (metres) => {
    const total = Math.round(metres * 39.3701)
    const ft = Math.floor(total / 12)
    const inch = total % 12
    return inch ? `${ft} ft ${inch} in` : `${ft} ft`
}
const feet = (metres) => {
    const value = metres * 3.28084
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ft`
}

export function buildChapters(data) {
    const fps = data.fps
    const contact = data.events.contact
    const f = (seconds) => contact + seconds * fps
    const at = (series, frame) => {
        const i = Math.floor(frame)
        return series[i] + (series[i + 1] - series[i]) * (frame - i)
    }
    const round = (series, frame, digits = 0) => at(series, frame).toFixed(digits)

    return [
        {
            id: 'whole',
            title: 'The whole thing, once',
            provenance: 'measured',
            body:
                'A serve takes about a second and a half from here. Watch the racket ' +
                'head speed build underneath it. Almost nothing happens for the first ' +
                'second: the chain is being set up, not driven.',
            camera: 'side',
            range: [0, Math.round(data.recLast)],
            speed: 0.25,
            chart: { mode: 'full' },
            readouts: [],
            annotations: [],
        },
        {
            id: 'where-speed',
            title: 'Where the speed actually comes from',
            provenance: 'measured',
            body:
                `The racket sits at about ${mph(at(data.speed, 0))} mph for a full second. ` +
                `It reaches ${mph(at(data.speed, contact))} mph at contact, and ` +
                `${Math.round(100 * (at(data.speed, contact) - at(data.speed, data.events.drop)) / at(data.speed, contact))}% ` +
                `of that arrives in the last ${((contact - data.events.drop) / fps).toFixed(2)} seconds. ` +
                'Everything before it is a wind-up.',
            camera: 'side',
            range: [Math.round(f(-0.55)), Math.round(contact + 6)],
            speed: 0.07,
            chart: { mode: 'highlight', from: data.events.drop, to: contact },
            readouts: [],
            annotations: ['headPath'],
        },
        {
            id: 'drop',
            title: 'The drop is an elbow fold',
            provenance: 'measured',
            body:
                `The racket reaches its lowest point behind the back, and it is easy to ` +
                `read that as pulling the arm back. The elbow says otherwise: it folds ` +
                `from ${round(data.elbow, f(-0.8))}° to ${round(data.elbow, data.events.drop)}° ` +
                `and then throws back out to ${round(data.elbow, contact)}°. The head path ` +
                'never stops or doubles back. The drop is what a loose arm does on the ' +
                'way up, not a position to put it in.',
            camera: { from: 'behind', to: 'shoulder' },
            range: [Math.round(f(-0.5)), Math.round(contact + 4)],
            speed: 0.06,
            chart: null,
            readouts: ['elbow'],
            annotations: ['headPath', 'elbowArc'],
        },
        {
            id: 'chain',
            title: 'The chain fires late',
            provenance: 'measured',
            body:
                `The legs load first: the front knee is at its deepest ` +
                `${round(data.knee, data.events.load)}° a full ${Math.abs((data.events.load - contact) / fps).toFixed(2)} s ` +
                'before contact, and is straight again by the time the ball is struck. ' +
                'The shoulders are last. They stay square to the hips through the whole ' +
                `load and then turn ${round(data.sep, contact)}° past them inside the ` +
                'final fifty milliseconds. Separation here is not held and unwound. It ' +
                'is created at the end, fast.',
            camera: { from: 'front', to: 'side' },
            range: [Math.round(f(-0.6)), Math.round(contact + 4)],
            speed: 0.06,
            chart: null,
            readouts: ['knee', 'sep'],
            annotations: ['bodyLines'],
        },
        {
            id: 'window',
            title: 'Contact is a five-millisecond window',
            provenance: 'measured',
            body:
                `At contact the face is ${round(data.face, contact, 1)}° from vertical. ` +
                `One frame earlier, five and a half thousandths of a second, it was ` +
                `${round(data.face, contact - 1, 1)}° open. One frame later it is ` +
                `${Math.abs(at(data.face, contact + 1)).toFixed(1)}° closed. The face is ` +
                `turning at about ${Math.round(((at(data.face, contact - 1) - at(data.face, contact + 1)) / 2) * fps)} degrees a second, ` +
                'and the ball is only on the strings for about four of those ' +
                'thousandths.',
            // Opens on the shoulder and closes in beside the strings,
            // because the last half of this chapter is a few degrees of
            // racket face and nothing else.
            camera: { from: 'shoulder', to: 'contactSide' },
            range: [Math.round(f(-0.06)), Math.round(contact + 8)],
            // 1/50. The whole chapter covers a tenth of a second across a
            // few centimetres; at the pace the rest of the page runs it
            // would be over before the camera arrived.
            speed: 0.02,
            chart: null,
            readouts: [],
            annotations: ['faceGhosts'],
        },
        {
            id: 'extension',
            title: 'Extension is what squares the face',
            provenance: 'measured',
            body:
                `The elbow is at ${round(data.elbow, contact)}° at contact, within ten ` +
                'degrees of straight, and the whole arm and racket are one line from the ' +
                `shoulder. That is what puts contact ${feetInches((data.headZ[Math.round(contact)] - (data.ground - 25)) / 1000)} ` +
                'up, and it is also what gets the face vertical at the top of the arc ' +
                'rather than on the way past it. Reach and accuracy are the same thing ' +
                'here.',
            camera: { from: 'shoulder', to: 'front' },
            range: [Math.round(f(-0.12)), Math.round(contact + 6)],
            speed: 0.03,
            chart: null,
            readouts: ['elbow'],
            annotations: ['extensionLine', 'contactHeight'],
        },
        {
            id: 'margin',
            title: 'How fine the margin is',
            provenance: 'measured',
            body:
                `This is the same player's serve ${data.ghost.serve}, faded, played ` +
                'against the one you have been watching. Both went in. Their contact ' +
                `points are ${inches(Math.abs(data.ghost.aheadMain - data.ghost.ahead))} inches ` +
                'apart, and at this frame rate the two motions are almost impossible to ' +
                'tell apart by eye. The difference between a serve that lands and one ' +
                'that does not lives inside that.',
            camera: 'side',
            range: [Math.round(f(-0.5)), Math.round(contact + 6)],
            speed: 0.06,
            chart: null,
            readouts: [],
            annotations: ['ghost'],
        },
        {
            id: 'outcome',
            title: 'What that buys',
            provenance: 'simulated',
            body:
                `About ${Math.round(data.ball.speed * MPH_PER_KMH)} mph off the strings, over the net ` +
                `by roughly ${inches(data.ball.net)} inches, landing ${feet(data.ball.X)} from the ` +
                `centre line and ${feet(data.ball.Y)} inside the service line. No ball was ` +
                'tracked in this capture, so the flight is simulated. It is solved to ' +
                'pass through the measured contact point and land where the lab recorded ' +
                'this serve going.',
            camera: { from: 'court', to: 'above' },
            /*
              Focus leaves the player and settles on the mark painted on
              the court as the camera rises. It is the last thing on the
              page, the overhead angle is where the lockup reads, and a
              shallow lens that stays locked to a figure who has finished
              serving would hold the one thing nobody is looking at any
              more in focus.
            */
            focusTo: 'mark',
            range: [Math.round(contact - 4), Math.round(data.ball.land + 8)],
            speed: 0.05,
            chart: null,
            readouts: [],
            annotations: ['ballFlight'],
        },
    ]
}
