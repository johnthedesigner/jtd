import { useContext } from 'react';

import { PasswordProvider } from "../../../../utils/context";
import PasswordDialog, { AuthButton, LogoutButton } from "../../../../components/PasswordDialog";

const headerStyle = {
    padding: "4rem",
    textAlign: "center",
    width: "90vw",
    maxWidth: "1200px",
    margin: "0 auto",
}

// Page Content (Password Protected)
const UnauthenticatedPageContent = ({ dialogOpen }) => {
    return (
        <div>
            <h1>Private Example Page</h1>
            <p>This is an example of a private page that requires a password to access.</p>
            <p>The password is: <strong>gottaseeit</strong></p>
            <p>Try entering the password to see the protected content.</p>
            <PasswordDialog dialogOpen={dialogOpen} />
        </div>
    );
}

const AuthenticatedPageContent = () => {
    return (
        <div>
            <h1>Protected Content</h1>
            <p>Congratulations! You have entered the correct password and can now see this protected content.</p>
            <p>This content is only visible to users who have authenticated with the correct password.</p>
            <p>Feel free to explore the rest of the site!</p>
            <LogoutButton />
        </div>
    );
}

const ProtectedPage = () => {
    const { authenticated, dialogOpen } = useContext(PasswordProvider);
    return (
        <div className="page-header" style={headerStyle}>
            {authenticated ? <AuthenticatedPageContent /> : <UnauthenticatedPageContent dialogOpen={dialogOpen} />}
        </div>
    );
}

export default ProtectedPage;