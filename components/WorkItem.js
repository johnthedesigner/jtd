import { useContext } from 'react';
import Link from 'next/link';
import { ArrowRight, Asterisk } from 'lucide-react';

import { PasswordProvider } from "../utils/context";
import PasswordDialog, { LogoutButton } from "./PasswordDialog";
import { palettes } from '../utils/colorUtils';
import Image from 'next/image';

// Password Protected Content
const UnauthenticatedPageContent = ({ dialogOpen, item }) => {
    const astStyle = {
        display: 'inline-block',
    }
    return (
        <>
            <div className="work-item__text-wrapper">
                <h3 className="work-item__subheading">Password Required</h3>
                <h2 className="work-item__heading">Shh! It's a Private Case Study</h2>
                <p className="work-item__description">Some of my work isn't ready for the whole world to see. But it's ok, just get in touch and I can give you the <em><b>secret password</b></em>.</p>
                <PasswordDialog dialogOpen={dialogOpen} />
            </div>
            <div className="work-item__image-wrapper">
                <Image className="work-item__image" width="438" height="600" src={item.imageBlurred} alt={`${item.title} image`} />
            </div>
        </>
    );
}

const AuthenticatedPageContent = ({ item }) => {
    const { authenticated, dialogOpen } = useContext(PasswordProvider);

    return (
        <>
            <div className="work-item__text-wrapper">
                <h3 className="work-item__subheading">{item.company}</h3>
                <h2 className="work-item__heading">{item.title}</h2>
                <p className="work-item__description">{item.description}</p>
                <Link className="work-item__link" href={item.href}>
                    View Case Study <ArrowRight style={{ display: 'inline' }} />
                </Link>
            </div>
            <div className="work-item__image-wrapper">
                <Image className="work-item__image" width="438" height="600" src={item.imageSharp} alt={`${item.title} image`} />
            </div>
        </>
    );
}

const WorkItem = ({ item }) => {
    const { authenticated, dialogOpen } = useContext(PasswordProvider);
    console.log('WORK ITEM', item);
    // Set CSS custom properties for dynamic colors
    const customProperties = {
        '--work-item-color-primary': palettes[item.color1][4].value,
        '--work-item-color-secondary': palettes[item.color2][4].value,
    };

    return (
        <div className="work-item" style={customProperties}>
            {authenticated || item.private == false ? <AuthenticatedPageContent item={item} /> : <UnauthenticatedPageContent dialogOpen={dialogOpen} item={item} />}
        </div >
    );
};

export default WorkItem;