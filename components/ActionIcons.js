import React from 'react'
import Color from 'color'

import { colorsWithFallback } from '../utils/colorUtils'

const getFillConfig = (artboard) => {
    let { adjustments } = artboard.selection

    var colors = {
        fill: null,
        stroke: null,
    }

    // If there isn't a fill config return empty object
    if (adjustments.fill === undefined) {
        return {}
    } else {
        let fillColors = colorsWithFallback(
            adjustments.fill.color,
            adjustments.fill.gradient
        )

        if (adjustments.fill.type === 'gradient') {
            colors.fill = fillColors.gradient
        } else {
            colors.fill = {
                angle: 0,
                start: fillColors.solid,
                end: fillColors.solid,
            }
        }

        colors.stroke =
            artboard.selection.adjustments.stroke &&
            artboard.selection.adjustments.stroke.strokeWidth > 0
                ? artboard.selection.adjustments.stroke.strokeColor
                : 'transparent'

        console.log(colors)
        return colors
    }
}

const ActionIcon = (props) => {
    const defaultFill = '#222'

    switch (props.iconType) {
        case 'plus':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={defaultFill}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )

        case 'sendToBack':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20 17C20.5523 17 21 16.5523 21 16V14.5C21 13.9477 20.5523 13.5 20 13.5C19.4477 13.5 19 13.9477 19 14.5V15H18.5C17.9477 15 17.5 15.4477 17.5 16C17.5 16.5523 17.9477 17 18.5 17H20ZM15.5 17C16.0523 17 16.5 16.5523 16.5 16C16.5 15.4477 16.0523 15 15.5 15H12.5C11.9477 15 11.5 15.4477 11.5 16C11.5 16.5523 11.9477 17 12.5 17H15.5ZM9.5 17C10.0523 17 10.5 16.5523 10.5 16C10.5 15.4477 10.0523 15 9.5 15H9V14.5C9 13.9477 8.55229 13.5 8 13.5C7.44772 13.5 7 13.9477 7 14.5V16C7 16.5523 7.44771 17 8 17H9.5ZM19 11.5C19 12.0523 19.4477 12.5 20 12.5C20.5523 12.5 21 12.0523 21 11.5V8.5C21 7.94772 20.5523 7.5 20 7.5C19.4477 7.5 19 7.94772 19 8.5V11.5ZM7 11.5C7 12.0523 7.44772 12.5 8 12.5C8.55229 12.5 9 12.0523 9 11.5L9 8.5C9 7.94771 8.55229 7.5 8 7.5C7.44772 7.5 7 7.94771 7 8.5L7 11.5ZM19 5.5C19 6.05229 19.4477 6.5 20 6.5C20.5523 6.5 21 6.05229 21 5.5V4C21 3.44772 20.5523 3 20 3H18.5C17.9477 3 17.5 3.44772 17.5 4C17.5 4.55229 17.9477 5 18.5 5H19V5.5ZM7 5.5C7 6.05228 7.44772 6.5 8 6.5C8.55229 6.5 9 6.05229 9 5.5V5L9.5 5C10.0523 5 10.5 4.55229 10.5 4C10.5 3.44771 10.0523 3 9.5 3H8C7.44772 3 7 3.44771 7 4V5.5ZM15.5 5C16.0523 5 16.5 4.55229 16.5 4C16.5 3.44772 16.0523 3 15.5 3H12.5C11.9477 3 11.5 3.44771 11.5 4C11.5 4.55229 11.9477 5 12.5 5L15.5 5ZM17 21C17.5523 21 18 20.5523 18 20C18 19.4477 17.5523 19 17 19L5 19L5 7C5 6.44772 4.55229 6 4 6C3.44772 6 3 6.44772 3 7V20C3 20.5523 3.44771 21 4 21L17 21Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'bringToFront':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20 17C20.5523 17 21 16.5523 21 16L21 4C21 3.44772 20.5523 3 20 3H8C7.44772 3 7 3.44771 7 4L7 16C7 16.5523 7.44771 17 8 17L20 17ZM19 5L19 15L9 15L9 5L19 5ZM17 21C17.5523 21 18 20.5523 18 20C18 19.4477 17.5523 19 17 19H15.375C14.8227 19 14.375 19.4477 14.375 20C14.375 20.5523 14.8227 21 15.375 21H17ZM12.125 21C12.6773 21 13.125 20.5523 13.125 20C13.125 19.4477 12.6773 19 12.125 19H8.875C8.32271 19 7.875 19.4477 7.875 20C7.875 20.5523 8.32271 21 8.875 21H12.125ZM5.625 21C6.17729 21 6.625 20.5523 6.625 20C6.625 19.4477 6.17729 19 5.625 19H5V18.375C5 17.8227 4.55229 17.375 4 17.375C3.44772 17.375 3 17.8227 3 18.375V20C3 20.5523 3.44771 21 4 21H5.625ZM3 15.125C3 15.6773 3.44772 16.125 4 16.125C4.55229 16.125 5 15.6773 5 15.125L5 11.875C5 11.3227 4.55229 10.875 4 10.875C3.44772 10.875 3 11.3227 3 11.875V15.125ZM3 8.625C3 9.17729 3.44772 9.625 4 9.625C4.55229 9.625 5 9.17729 5 8.625V7C5 6.44772 4.55229 6 4 6C3.44772 6 3 6.44772 3 7V8.625Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'textLayer':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={defaultFill}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
            )

        case 'text':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M3 4C3 3.44772 3.44772 3 4 3H12H20C20.5523 3 21 3.44772 21 4V7C21 7.55228 20.5523 8 20 8C19.4477 8 19 7.55228 19 7V5H13V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H12H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V5H5V7C5 7.55228 4.55228 8 4 8C3.44772 8 3 7.55228 3 7V4Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'ellipse':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={defaultFill}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                </svg>
            )

        case 'fill':
            let swatchColors = getFillConfig(props.artboard)
            return (
                <>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="url(#fillGradient)"
                        stroke={swatchColors.strokeColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <linearGradient
                            id="fillGradient"
                            x1="0%"
                            x2="0%"
                            y1="0%"
                            y2="100%"
                        >
                            <stop
                                className="stop1"
                                offset="0%"
                                stopColor={
                                    swatchColors.fill
                                        ? swatchColors.fill.start
                                        : null
                                }
                            />
                            <stop
                                className="stop2"
                                offset="100%"
                                stopColor={
                                    swatchColors.fill
                                        ? swatchColors.fill.end
                                        : null
                                }
                            />
                        </linearGradient>
                        <circle cx="12" cy="12" r="10" strokecolor="red" />
                    </svg>
                </>
            )

        case 'image':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            )

        case 'rectangle':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
            )

        case 'resize':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g clipPath="url(#clip0_121_5841)">
                        <rect width="24" height="24" fill="none" />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14 4C14 3.44772 14.4477 3 15 3H20C20.5523 3 21 3.44772 21 4V9C21 9.55228 20.5523 10 20 10C19.4477 10 19 9.55228 19 9V5H15C14.4477 5 14 4.55228 14 4Z"
                            fill="currentColor"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4 14C4.55228 14 5 14.4477 5 15V19H9C9.55228 19 10 19.4477 10 20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V15C3 14.4477 3.44772 14 4 14Z"
                            fill="currentColor"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M20 13C20.5523 13 21 13.4477 21 14L21 20C21 20.5523 20.5523 21 20 21L14 21C13.4477 21 13 20.5523 13 20C13 19.4477 13.4477 19 14 19L17.5858 19L5 6.41421L5 10C5 10.5523 4.55228 11 4 11C3.44771 11 3 10.5523 3 10L3 4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3L10 3C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6.41421L19 17.5858L19 14C19 13.4477 19.4477 13 20 13Z"
                            fill="currentColor"
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_121_5841">
                            <rect width="24" height="24" fill="none" />
                        </clipPath>
                    </defs>
                </svg>
            )

        case 'newText':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3 4C3 3.44772 3.44772 3 4 3H12H20C20.5523 3 21 3.44772 21 4V7C21 7.55228 20.5523 8 20 8C19.4477 8 19 7.55228 19 7V5H13V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H12H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V5H5V7C5 7.55228 4.55228 8 4 8C3.44772 8 3 7.55228 3 7V4ZM6 14C6.55228 14 7 14.4477 7 15V16H8C8.55228 16 9 16.4477 9 17C9 17.5523 8.55228 18 8 18H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5V15C5 14.4477 5.44772 14 6 14Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'newRectangle':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H8.5C7.94772 21 7.5 20.5523 7.5 20C7.5 19.4477 7.94772 19 8.5 19H19V5H5V13C5 13.5523 4.55228 14 4 14C3.44772 14 3 13.5523 3 13V4ZM6 14C6.55228 14 7 14.4477 7 15V16H8C8.55228 16 9 16.4477 9 17C9 17.5523 8.55228 18 8 18H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5V15C5 14.4477 5.44772 14 6 14Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'newEllipse':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 12.2972 5.01846 12.5896 5.05421 12.8763C5.12255 13.4243 4.73367 13.924 4.18563 13.9923C3.63759 14.0607 3.13792 13.6718 3.06958 13.1237C3.02362 12.7552 3 12.3801 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C10.8083 21 9.6684 20.7679 8.62478 20.3454C8.11285 20.1382 7.86584 19.5552 8.07306 19.0433C8.28029 18.5313 8.86328 18.2843 9.37522 18.4915C10.1845 18.8191 11.0699 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM6 14C6.55228 14 7 14.4477 7 15V16H8C8.55228 16 9 16.4477 9 17C9 17.5523 8.55228 18 8 18H7V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5V15C5 14.4477 5.44772 14 6 14Z"
                        fill="currentColor"
                    />
                </svg>
            )

        case 'blending':
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6 4C6 3.44772 6.44772 3 7 3H20C20.5523 3 21 3.44772 21 4V17C21 17.5523 20.5523 18 20 18C19.4477 18 19 17.5523 19 17V5H7C6.44772 5 6 4.55228 6 4Z"
                        fill="currentColor"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.29289 6.29289C3.68342 5.90237 4.31658 5.90237 4.70711 6.29289L17.7071 19.2929C18.0976 19.6834 18.0976 20.3166 17.7071 20.7071C17.3166 21.0976 16.6834 21.0976 16.2929 20.7071L3.29289 7.70711C2.90237 7.31658 2.90237 6.68342 3.29289 6.29289Z"
                        fill="currentColor"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.29289 11.2929C3.68342 10.9024 4.31658 10.9024 4.70711 11.2929L12.7071 19.2929C13.0976 19.6834 13.0976 20.3166 12.7071 20.7071C12.3166 21.0976 11.6834 21.0976 11.2929 20.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929Z"
                        fill="currentColor"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.29289 6.29289C8.68342 5.90237 9.31658 5.90237 9.70711 6.29289L17.7071 14.2929C18.0976 14.6834 18.0976 15.3166 17.7071 15.7071C17.3166 16.0976 16.6834 16.0976 16.2929 15.7071L8.29289 7.70711C7.90237 7.31658 7.90237 6.68342 8.29289 6.29289Z"
                        fill="currentColor"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.29289 16.2929C3.68342 15.9024 4.31658 15.9024 4.70711 16.2929L7.70711 19.2929C8.09763 19.6834 8.09763 20.3166 7.70711 20.7071C7.31658 21.0976 6.68342 21.0976 6.29289 20.7071L3.29289 17.7071C2.90237 17.3166 2.90237 16.6834 3.29289 16.2929Z"
                        fill="currentColor"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13.2929 6.29289C13.6834 5.90237 14.3166 5.90237 14.7071 6.29289L17.7071 9.29289C18.0976 9.68342 18.0976 10.3166 17.7071 10.7071C17.3166 11.0976 16.6834 11.0976 16.2929 10.7071L13.2929 7.70711C12.9024 7.31658 12.9024 6.68342 13.2929 6.29289Z"
                        fill="currentColor"
                    />
                </svg>
            )

        default:
            return null
    }
}

export default ActionIcon
