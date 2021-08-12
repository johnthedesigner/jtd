import { useEffect, useState } from 'react'
import _ from 'lodash'
import Tooltip from '@material-ui/core/Tooltip'

const SelectInput = (props) => {
    const [localValue, setLocalValue] = useState('')

    useEffect(() => {
        if (props.valueFromProps) setLocalValue(props.valueFromProps)
    }, [])

    const handleChange = (e) => {
        setLocalValue(e.target.value)
        props.setValue(e.target.value)
    }

    const { propertyName, label, options, tooltipText } = props

    const labelStyles = {
        display: label ? 'block' : 'none',
    }

    return (
        <div className="adjustments-input adjustments-input--select">
            <label
                htmlFor={'dimensions-adjustment__' + propertyName}
                style={labelStyles}
            >
                {label}
            </label>
            <Tooltip title={tooltipText} placement="right">
                <select value={localValue} onChange={handleChange}>
                    {_.map(options, (option) => {
                        return (
                            <option key={option.value} value={option.value}>
                                {option.name}
                            </option>
                        )
                    })}
                </select>
            </Tooltip>
        </div>
    )
}

export default SelectInput