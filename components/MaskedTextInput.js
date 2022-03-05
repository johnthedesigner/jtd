import { useEffect, useState } from 'react'

const MaskedTextInput = (props) => {
    const [value, setValue] = useState('')

    useEffect(() => {
        if (props.valueFromProps) {
            setValue(props.valueFromProps)
        }
    }, [props.valueFromProps])

    const handleChange = (e) => {
        setValue(e.target.value)
    }

    const handleFocus = (e) => {
        e.target.select()
    }

    const handleBlur = (e) => {
        let newValue = e.target.value - 0
        if (newValue != NaN) {
            props.setValue(value)
        } else {
            setValue(valueFromProps)
        }
    }

    const handleKeyPress = (e) => {
        switch (e.key) {
            case 'Enter':
                e.target.blur()
                break
            case 'ArrowUp':
                props.setValue(value + (e.shiftKey ? 10 : 1))
                break
            case 'ArrowDown':
                props.setValue(value - (e.shiftKey ? 10 : 1))
                break
            default:
                return true
        }
    }

    const { propertyName, label, tooltipText } = props

    const labelStyles = {
        display: label ? 'block' : 'none',
    }

    return (
        <div className="adjustments-input adjustments-input--text">
            <label
                htmlFor={'dimensions-adjustment__' + propertyName}
                style={labelStyles}
            >
                {label}
            </label>
            {/* <Tooltip title={tooltipText} placement="right"> */}
            <input
                type={'text'}
                value={value}
                placeholder={'-'}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyPress}
                onFocus={handleFocus}
            />
            {/* </Tooltip> */}
        </div>
    )
}

export default MaskedTextInput
