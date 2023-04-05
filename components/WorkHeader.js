const WorkHeader = ({ superHead, headline }) => {
    return (
        <div className="intro">
            <div className="intro-copy">
                <h1 className="intro-copy__superhead">{superHead}</h1>
                <h2 className="intro-copy__headline">{headline}</h2>
            </div>
        </div>
    )
}

export default WorkHeader
