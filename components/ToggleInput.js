import React from 'react'

const ToggleInput = (props) => {
    const { handleChange, propertyName, type } = props

    return (
        <div className="adjustments-input adjustments-input--toggle-button">
            <button
                type={type}
                onClick={() => handleChange(props.valueFromProps)}
            >
                {propertyName}
            </button>
        </div>
    )
}

export default ToggleInput
