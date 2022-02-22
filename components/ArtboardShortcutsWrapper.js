import { useHotkeys } from 'react-hotkeys-hook'
import { useEffect, useState } from 'react'

import {
    bumpLayers,
    copyLayers,
    deleteLayers,
    pasteLayers,
    selectAllLayers,
    undoAction,
} from '../utils/actions'

const ArtboardShortcutsWrapper = (props) => {
    const [artboard, setArtboard] = useState(null)
    useEffect(() => {
        setArtboard(props.artboard)
    })

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
    useHotkeys('cmd+a', (e) => {
        e.preventDefault()
        props.dispatch(selectAllLayers())
    })
    useHotkeys('ctrl+a', (e) => {
        e.preventDefault()
        props.dispatch(selectAllLayers())
    })
    useHotkeys('cmd+c', (e) => {
        e.preventDefault()
        props.dispatch(copyLayers())
    })
    useHotkeys('ctrl+c', (e) => {
        e.preventDefault()
        props.dispatch(copyLayers())
    })
    useHotkeys('cmd+v', () => {
        props.dispatch(pasteLayers())
    })
    useHotkeys('ctrl+v', () => {
        props.dispatch(pasteLayers())
    })
    useHotkeys('cmd+z', () => {
        props.dispatch(undoAction())
    })
    useHotkeys('ctrl+z', () => {
        props.dispatch(undoAction())
    })
    useHotkeys('cmd+e', () => {
        console.log(JSON.stringify(artboard))
    })

    return <>{props.children}</>
}

export default ArtboardShortcutsWrapper
