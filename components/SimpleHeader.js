const headerStyles = {
    padding: '10rem 0 4rem',
    maxWidth: '90vw',
    margin: '0 auto',
    textAlign: 'center',
    lineHeight: 1,
};

const SimpleHeader = ({ title }) => {
    return (
        <header className="simple-header" style={headerStyles}>
            <h1>{title}</h1>
        </header>
    );
};

export default SimpleHeader;