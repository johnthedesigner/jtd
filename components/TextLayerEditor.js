import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { scaleAllDimensions, scaleDimension } from '../utils/artboardUtils'
import { typeStyles } from '../utils/adjustmentOptions'

const TextLayerEditor = (props) => {
    let { artboardSize } = props
    let { scaleFactor, text } = props.layer
    let { dimensions } = props.layer.adjustments
    const textarea = useRef(null)

    const [textContent, setTextContent] = useState()

    useEffect(() => {
        textarea.current.select()
        setTextContent(text)
    }, [])

    // Sanitize text and prevent newlines
    const prepText = (text) => {
        return text.replace(/[<>]/gi, '').replace(/\r\n|\r|\n/g, '')
    }

    const handleBlur = (e) => {
        props.dispatch(props.updateText(prepText(e.target.value)))
        props.dispatch(props.enableTextEditor([]))
    }

    const handleChange = (e) => {
        setTextContent(prepText(e.target.value))
    }

    const handleClick = (e) => {
        e.stopPropagation()
    }

    let { adjustments } = props.layer
    let fontFamilyProps = _.find(typeStyles.families, (family) => {
        return family.id === adjustments.text.fontFamily
    })
    let fontSize = scaleDimension(
        adjustments.text.fontSize,
        props.scaleFactor,
        true
    )
    dimensions = scaleAllDimensions(dimensions, props.scaleFactor, true)

    let editorStyles = {
        border: 'none',
        position: 'absolute',
        top: `${dimensions.y + artboardSize.yOffset}px`,
        left: `${dimensions.x + artboardSize.xOffset}px`,
        width: `${dimensions.width}px`,
        height: '1000px',
        outline: 'none',
        paddingTop: '.4rem',
        paddingLeft: 0,
        background: 'none',
        color: adjustments.text.color,
        fontFamily: fontFamilyProps.value,
        fontSize: `${fontSize}px`,
        fontWeight: adjustments.text.fontWeight,
        lineHeight: `${fontSize * 1.175}px`,
        textAlign: adjustments.text.align,
        zIndex: 1003,
    }

    return (
        <textarea
            ref={textarea}
            onBlur={handleBlur}
            onClick={handleClick}
            onChange={handleChange}
            style={editorStyles}
            value={textContent}
        ></textarea>
    )
}

TextLayerEditor.propTypes = {
    layer: PropTypes.object.isRequired,
}

export default TextLayerEditor
