/**
 * A live readout of what the GPU is actually running.
 *
 * Screenshots taken by tooling and what a person has on screen can disagree —
 * a stale compiled shader, a texture that failed to build, a different GPU —
 * and when they do, arguing from renders is useless. The court shader writes
 * its real uniform values here every frame so the page can show them, which
 * turns "I can't see it" into a number both sides can read.
 */
export const debugState = {
    active: false,
    values: {},
    renderer: '',
    signature: '',
    maskMeanWood: null,
    maskSize: '',
    query: '',
    resolved: '',
    tuning: '',
    texture: '',
    postfx: null,
}

export function setDebugValue(key, value) {
    debugState.values[key] = value
}
