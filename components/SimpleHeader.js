const headerStyles = {
    padding: '10rem 0 4rem',
    textAlign: 'center',
};

const SimpleHeader = ({ title }) => {
    return (
        <header className="simple-header" style={headerStyles}>
            <h1>{title}</h1>
        </header>
    );
};

export default SimpleHeader;