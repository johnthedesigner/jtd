import Color from 'color'
import _ from 'lodash'

const ColorPicker = (props) => {
    let { updateColor } = props

    const ColorDot = (props) => {
        return (
            <div className="color-picker__color-dot-wrapper">
                <div
                    className="color-picker__color-dot"
                    onClick={() => updateColor(props.color.string())}
                    style={{ background: props.color }}
                />
            </div>
        )
    }

    if (props.show) {
        return (
            <div className="color-picker">
                <div className={'color-picker__row'} key={`colorRowGrayscale`}>
                    <ColorDot color={Color('rgba(32, 32, 32)')} />
                    <ColorDot color={Color('rgba(90, 90, 90)')} />
                    <ColorDot color={Color('rgba(140, 140, 140)')} />
                    <ColorDot color={Color('rgba(200, 200, 200)')} />
                    <ColorDot color={Color('rgba(255, 255, 255)')} />
                </div>
                {_.map(props.colors, (color) => {
                    color = Color(color)
                    return (
                        <div
                            className={'color-picker__row'}
                            key={`colorRow${color}`}
                        >
                            <ColorDot
                                color={color.darken('.4').desaturate('.2')}
                            />
                            <ColorDot
                                color={color.darken('.2').desaturate('.1')}
                            />
                            <ColorDot color={color} />
                            <ColorDot
                                color={color.lighten('.2').saturate('.2')}
                            />
                            <ColorDot
                                color={color.lighten('.3').saturate('.4')}
                            />
                        </div>
                    )
                })}
            </div>
        )
    } else {
        return null
    }
}

export default ColorPicker
