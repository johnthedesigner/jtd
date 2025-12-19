// import { Dialog, DialogTitle, DialogContent, DialogContentText, Alert, TextField, IconButton } from "@mui/material";
import { useContext } from 'react';
// import { Button, Skeleton } from "@mui/material";
// import Visibility from '@mui/icons-material/Visibility';
// import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import Link from 'next/link';

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { PasswordProvider } from "../utils/context"
import { Key, KeyRound } from 'lucide-react';

// export const AuthButton = () => {
//     const { authenticated, setDialogOpen } = useContext(PasswordProvider);
//     if (!authenticated) return (
//         // <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
//         //     Authenticate
//         // </Button>
//     );
// }

export const LogoutButton = () => {
    const { logout } = useContext(PasswordProvider);
    return (
        <button className="button" onClick={logout}>
            Log Out
        </button>
    );
}

const PasswordDialog = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { authLoading, authenticated, passwordError, handlePassword } = useContext(PasswordProvider);
    // const handleClose = () => {
    //     setDialogOpen(false);
    // };

    const submitPassword = async () => {
        await handlePassword(password);
        // setDialogOpen(false);
        setPassword('');
    };

    console.log('PasswordDialog rendered with authenticated:', authenticated, 'authLoading:', authLoading, 'passwordError:', passwordError);
    {
        if (!authenticated) {
            console.log('Rendering PasswordDialog: User not authenticated');
            return (
                <Dialog>
                    <form>
                        <DialogTrigger asChild>
                            <button className="button"> <KeyRound style={{ display: 'inline' }} />Enter the Password</button>
                        </DialogTrigger>
                        <DialogOverlay style={{ background: 'rgb(from var(--navy-blue-4) R G B / 0.5)', backdropFilter: 'blur(8px)' }} />
                        <DialogContent className="auth-dialog">
                            {/* <DialogHeader> */}
                            {/* <img src="/work/paletteer/header.svg" alt="Header Image" style={{ width: '100%', height: 'auto', marginBottom: '1rem' }} /> */}
                            {/* <DialogTitle style={{ fontFamily: 'var(--primary-font)', fontSize: '1.5rem', margin: 0 }}>Got the password?</DialogTitle>
                            <DialogDescription style={{ margin: 0 }}>
                                It's ok if not, just ask John.
                            </DialogDescription> */}
                            {/* </DialogHeader> */}
                            <div className="grid gap-8">
                                <div>
                                    <DialogTitle style={{ fontFamily: 'var(--primary-font)', fontSize: '2rem', margin: '.5rem 0' }}>Got the password?</DialogTitle>
                                    <DialogDescription style={{ fontSize: '1.25rem', margin: '.5rem 0', color: 'var(--main-font-color' }}>
                                        It's ok if not, just ask John.
                                    </DialogDescription>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="name-1">Password</Label>
                                    <Input id="name-1" type={showPassword ? "text" : "password"}
                                        placeholder="Enter the password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyUp={(e) => { if (e.key === 'Enter') submitPassword() }} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <button className="button button--outline-light" variant="outline">Cancel</button>
                                </DialogClose>
                                <button className="button button--light" type="submit" onClick={submitPassword}>Submit</button>
                            </DialogFooter>
                        </DialogContent>
                    </form>
                </Dialog >
            )
        } else {
            console.log('Rendering PasswordDialog: User authenticated');
            return (
                // <Button variant="contained" color="primary" onClick={logout}>
                //     Log Out
                // </Button >
                <h3>TEST</h3>
            )
        }
    }
}

export default PasswordDialog