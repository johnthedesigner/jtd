const WorkHeader = ({ superHead, headline, palette }) => {
    const introStyles = {
        backgroundColor: palette[3],
        color: palette[8],
        borderBottom: `1px solid ${palette[5]}`,
    }

    const superHeadStyles = {
        color: palette[0],
    }

    const backLinkStyles = {
        color: palette[7],
        background: palette[2],
    }

    return (
        <div className="intro" style={introStyles}>
            <div className="intro-copy">
                <h1 className="intro-copy__superhead" style={superHeadStyles}>
                    {superHead}
                </h1>
                <h2 className="intro-copy__headline">{headline}</h2>
            </div>
        </div>
    )
}

export default WorkHeader
