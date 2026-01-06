import { useContext } from 'react';
import { PasswordProvider } from "../utils/context"

const PasswordProtect = ({ isPrivate, AuthenticatedContent, UnauthenticatedContent }) => {
    const { authenticated } = useContext(PasswordProvider);
    if (isPrivate && !authenticated) {
        return (
            <UnauthenticatedContent />
        );
    }
    return (
        <AuthenticatedContent />
    );
}

export default PasswordProtect;