import { useState, useContext, useEffect } from 'react'
import { KeyRound } from 'lucide-react'
import { PasswordProvider } from '@/utils/context'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const LogoutButton = () => {
    const { logout } = useContext(PasswordProvider)
    return (
        <Button variant="ghost" onClick={logout}>Log Out</Button>
    )
}

const PasswordDialog = ({ triggerVariant = 'white', open: externalOpen, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const [password, setPassword] = useState('')
    const { authenticated, passwordError, handlePassword } = useContext(PasswordProvider)

    const isControlled = externalOpen !== undefined
    const open = isControlled ? externalOpen : internalOpen
    const setOpen = isControlled ? onOpenChange : setInternalOpen

    const close = () => {
        setOpen(false)
        setPassword('')
    }

    const submit = () => handlePassword(password)

    useEffect(() => {
        if (authenticated) close()
    }, [authenticated])

    if (authenticated) return null

    return (
        <>
            {!isControlled && (
                <Button variant={triggerVariant} onClick={() => setOpen(true)} className="self-start inline-flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Enter the password
                </Button>
            )}

            <Modal open={open} onClose={close} aria-label="Enter password">
                <ModalHeader>
                    <ModalTitle>Got the password?</ModalTitle>
                    <ModalDescription>It&apos;s ok if not, just ask John.</ModalDescription>
                </ModalHeader>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Label htmlFor="modal-pw">Password</Label>
                    <Input
                        id="modal-pw"
                        type="password"
                        placeholder="Enter the password"
                        value={password}
                        error={passwordError}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submit() }}
                        autoFocus
                    />
                    {passwordError && (
                        <p style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '13px',
                            color: 'var(--color-error)',
                            margin: 0,
                        }}>
                            Incorrect password — try again.
                        </p>
                    )}
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                    <Button variant="primary" onClick={submit}>Submit</Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

export default PasswordDialog
