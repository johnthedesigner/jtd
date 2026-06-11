import Footer from "./Footer";
import Header from "./Header";

const Layout = ({ children }) => {
    return (
        <div className="layout">
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