import { useContext } from "react";

import { PasswordProvider } from "../utils/context";
import PasswordDialog from "./PasswordDialog";

const UnauthenticatedContent = () => {
    const { authenticated, dialogOpen } = useContext(PasswordProvider);

    return (
        <div className="unauthenticated-case-study__hero">
            <div className="unauthenticated-case-study__hero-content">
                <h1 className="unauthenticated-case-study__title">
                    <em>Shh!</em> It's a Private Case Study
                </h1>
                <h2 className="unauthenticated-case-study__subtitle">
                    Some of my work isn't ready for the whole world to see. But it's ok, just get in touch and I can give you the secret password.
                </h2>
                <PasswordDialog dialogOpen={dialogOpen} />
            </div>
        </div>
    );
}

export default UnauthenticatedContent;