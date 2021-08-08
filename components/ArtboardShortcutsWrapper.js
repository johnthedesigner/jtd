import { useHotkeys, useHotKeys } from 'react-hotkeys-hook'

import {
    bumpLayers,
    copyLayers,
    deleteLayers,
    pasteLayers,
    undoAction,
} from '../utils/actions'

const ArtboardShortcutsWrapper = (props) => {
    // Set up key commands
    useHotkeys('shift+up', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('y', -10))
    })
    useHotkeys('shift+down', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('y', 10))
    })
    useHotkeys('shift+left', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('x', -10))
    })
    useHotkeys('shift+right', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('x', 10))
    })
    useHotkeys('up', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('y', -1))
    })
    useHotkeys('down', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('y', 1))
    })
    useHotkeys('left', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('x', -1))
    })
    useHotkeys('right', (e) => {
        // e.preventDefault()
        props.dispatch(bumpLayers('x', 1))
    })
    useHotkeys('backspace', (e) => {
        props.dispatch(deleteLayers())
    })
    useHotkeys(['command+c', 'control+c'], () => {
        props.dispatch(copyLayers())
    })
    useHotkeys(['command+v', 'control+v'], () => {
        props.dispatch(pasteLayers())
    })
    useHotkeys(['command+z', 'control+z'], () => {
        props.dispatch(undoAction())
    })
    useHotkeys(['command+e', 'control+e'], () => {
        console.log(JSON.stringify(currentArtboard))
    })

    return <div>{props.children}</div>
}

export default ArtboardShortcutsWrapper
