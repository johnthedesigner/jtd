import Footer from "./Footer";
import Header from "./Header";

const pageStyles = {
    backgroundImage: "url('/logobg.svg')",
    backgroundSize: "110% auto",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center 10rem",
}

const Layout = ({ children }) => {
    return (
        <div className="layout" style={pageStyles}>
            <main className="main-content" style={{ backgroundColor: "inherit" }}>
                <Header />
                <div className="content" style={{ minHeight: "100vh" }}>
                    {children}
                </div>
                <Footer />
            </main>
        </div>
    );
}

export default Layout;