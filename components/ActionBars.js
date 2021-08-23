import ActionIcon from './ActionIcons'
import { addLayer } from '../utils/actions'

const ActionBars = (props) => {
    const addEllipse = (e) => {
        e.target.blur()
        props.dispatch(addLayer('ellipse'))
    }

    const addRectangle = (e) => {
        e.target.blur()
        props.dispatch(addLayer('rectangle'))
    }

    const addText = (e) => {
        e.target.blur()
        props.dispatch(addLayer('text'))
    }

    const handleClick = (e) => e.stopPropagation()

    const showImagePicker = (e) => {
        e.target.blur()
        this.props.toggleImagePicker()
    }

    return (
        <div>
            <div className="action-bar__top-right" onClick={handleClick}>
                <button className="action-bar__plus-icon">
                    <ActionIcon iconType="plus" fill="rgba(0,0,0,.2)" />
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
            <div className="action-bar__bottom-right" onClick={handleClick}>
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
            </div>
        </div>
    )
}

export default ActionBars
