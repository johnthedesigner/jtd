import { useEffect, useRef, useState } from 'react'

const WiggleButton = ({ children, onClick, style }) => {
    const buttonRef = useRef(null)
    const squigglePathRef = useRef(null)
    const followPathRef = useRef(null)

    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)

    async function makeSquiggle(
        squigglePathId,
        followPathId,
        squiggleStep,
        squiggleAmplitude
    ) {
        var factor = 2
        // var followPath = await document.getElementById(followPathId)
        var followPath = followPathRef.current
        var pathLen = followPath.getTotalLength()

        // Adjust step so that there are a whole number of steps along the path
        var numSteps = Math.round(pathLen / squiggleStep)

        var pos = followPath.getPointAtLength(0)
        var newPath = 'M' + [pos.x, pos.y].join(',')
        var side = -0.1
        for (var i = 1; i <= numSteps; i++) {
            var last = pos
            var pos = followPath.getPointAtLength((i * pathLen) / numSteps)

            // Find a point halfway between last and pos. Then find the point that is
            // perpendicular to that line segment, and is squiggleAmplitude away from
            // it on the side of the line designated by 'side' (-1 or +1).
            // This point will be the control point of the quadratic curve forming the
            // squiggle step.

            // The vector from the last point to this one
            var vector = { x: pos.x - last.x, y: pos.y - last.y }
            // The length of this vector
            var vectorLen = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
            // The point halfwasy between last point and tis one
            var half = {
                x: last.x + vector.x / factor,
                y: last.y + vector.y / factor,
            }
            // The vector that is perpendicular to 'vector'
            var perpVector = {
                x: -((squiggleAmplitude * vector.y) / vectorLen),
                y: (squiggleAmplitude * vector.x) / vectorLen,
            }
            // No calculate the control point position
            var controlPoint = {
                x: half.x + perpVector.x * side,
                y: half.y + perpVector.y * side,
            }
            newPath +=
                'Q' + [controlPoint.x, controlPoint.y, pos.x, pos.y].join(',')
            // Switch the side (for next step)
            side = -side
        }
        // var squigglePath = document.getElementById(squigglePathId)
        var squigglePath = squigglePathRef.current
        squigglePath.setAttribute('d', newPath)
    }

    useEffect(() => {
        let buttonElement = buttonRef.current
        let buttonWidth = buttonElement.getBoundingClientRect().width
        let buttonHeight = buttonElement.getBoundingClientRect().height
        let ratio = buttonHeight / buttonWidth
        let waveAmplitude = 70
        let waveStep = waveAmplitude * 0.2

        console.log(buttonElement.getBoundingClientRect().width)

        setWidth(buttonWidth)
        setHeight(buttonHeight)

        makeSquiggle('squiggle', 'follow', waveStep, waveAmplitude)
    }, [width, height])

    let pathStartX = width * -0.1
    let pathStartY = height * 0.5
    let pathEndX = width * 1.1
    let pathEndY = height * 0.5

    const buttonStyles = {
        display: 'inline-block',
        position: 'relative',
        border: 'none',
        background: 'none',
        padding: '.5rem 2rem',
        overflow: 'visible',
        cursor: 'pointer',
    }

    const textStyles = {
        position: 'relative',
        fontSize: '1.25rem',
        zIndex: 10,
    }

    const svgStyles = {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1,
        overflow: 'visible',
    }

    return (
        <>
            <button
                className="squiggle-button"
                ref={buttonRef}
                onClick={onClick}
                type="submit"
                style={style}
            >
                <svg
                    className="squiggle-button__svg"
                    width={width}
                    height={height}
                    fill="none"
                >
                    <path
                        ref={followPathRef}
                        id="follow"
                        d={`M ${pathStartX},${pathStartY} L ${pathEndX},${pathEndY}`}
                    />
                    <path
                        ref={squigglePathRef}
                        className="squiggle-button__squiggle"
                        id="squiggle"
                        d="M0,0"
                        stroke="red"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="squiggle-button__text">{children}</span>
            </button>
        </>
    )
}

export default WiggleButton
