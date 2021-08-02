export const colorsWithFallback = (solid, gradient) => {
    if (!solid && gradient) solid = gradient.start

    if (!gradient && solid)
        gradient = {
            angle: 0,
            start: solid,
            end: solid,
        }

    return {
        solid,
        gradient,
    }
}
