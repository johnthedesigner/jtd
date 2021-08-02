const Artboard = (props) => {
    const frameStyles = {
        width: props.artboardSize.viewportWidth,
        height: props.artboardSize.viewportHeight,
    }

    return <div style={frameStyles}>{props.children}</div>
}

export default Artboard
