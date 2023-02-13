import { useEffect, useState } from 'react'

import ActionIcon from './ActionIcons'
import { addLayer } from '../utils/actions'
import { unscaleDimension } from '../utils/artboardUtils'

const ActionBars = (props) => {
    const [layerOffsetX, setLayerOffsetX] = useState(0)
    const [layerOffsetY, setLayerOffsetY] = useState(0)

    useEffect(() => {
        // let artboard = document.getElementById('artboard__svg')
        let viewbox = document.getElementById('artboard-wrapper')

        let handleScroll = () => {
            setLayerOffsetX(
                unscaleDimension(
                    viewbox.scrollLeft + viewbox.clientWidth / 2,
                    props.scaleFactor
                )
            )
            setLayerOffsetY(
                unscaleDimension(
                    viewbox.scrollTop + viewbox.clientHeight / 2,
                    props.scaleFactor
                )
            )
        }

        setTimeout(handleScroll, 20)

        viewbox.addEventListener('scroll', handleScroll)

        return () => {
            viewbox.removeEventListener('scroll', handleScroll)
        }
    }, [props.scaleFactor, layerOffsetX, layerOffsetY])

    const addEllipse = (e) => {
        e.target.blur()
        props.dispatch(
            addLayer('ellipse', { x: layerOffsetX, y: layerOffsetY })
        )
    }

    const addRectangle = (e) => {
        e.target.blur()
        props.dispatch(
            addLayer('rectangle', { x: layerOffsetX, y: layerOffsetY })
        )
    }

    const addText = (e) => {
        e.target.blur()
        props.dispatch(addLayer('text', { x: layerOffsetX, y: layerOffsetY }))
    }

    const handleClick = (e) => e.stopPropagation()

    const showImagePicker = (e) => {
        e.target.blur()
        this.props.toggleImagePicker()
    }

    let temporarilyDisableActionBars = true
    if (temporarilyDisableActionBars) return null

    return (
        <div>
            <div className="action-bar__top-right" onClick={handleClick}>
                <button className="action-bar__plus-icon">
                    <ActionIcon iconType="plus" fill="white" />
                </button>
                <button className="action-bar__button" onClick={addRectangle}>
                    <ActionIcon iconType="rectangle" fill={props.buttonFill} />
                </button>
                <button className="action-bar__button" onClick={addEllipse}>
                    <ActionIcon iconType="ellipse" fill={props.buttonFill} />
                </button>
                <button
                    className="action-bar__button"
                    onClick={showImagePicker}
                >
                    <ActionIcon iconType="image" fill={props.buttonFill} />
                </button>
                <button className="action-bar__button" onClick={addText}>
                    <ActionIcon iconType="textLayer" fill={props.buttonFill} />
                </button>
            </div>
            {/* <div className="action-bar__bottom-right" onClick={handleClick}>
                <button
                    className="action-bar__button"
                    onClick={(e) => {
                        props.moveLayers('front')
                    }}
                >
                    <ActionIcon
                        iconType="bringToFront"
                        fill={props.buttonFill}
                    />
                </button>
                <button
                    className="action-bar__button"
                    onClick={(e) => {
                        props.moveLayers('back')
                    }}
                >
                    <ActionIcon iconType="sendToBack" fill={props.buttonFill} />
                </button>
            </div> */}
        </div>
    )
}

export default ActionBars
