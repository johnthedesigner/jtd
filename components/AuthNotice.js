import { useState, useEffect, useRef } from 'react'
import { Unlock } from 'lucide-react'
import { LogoutButton } from "./PasswordDialog"
import Link from 'next/link'

const AuthNotice = () => {
    const [isOpen, setIsOpen] = useState(false)
    const authNoticeRef = useRef(null)
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    const toggleTooltip = () => {
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (authNoticeRef.current && !authNoticeRef.current.contains(event.target) && isOpen) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div ref={authNoticeRef} className={`auth-notice ${isOpen ? 'auth-notice--open' : ''}`}>
            <div className="auth-notice__fab" onClick={toggleTooltip}>
                <Unlock size={24} absoluteStrokeWidth={true} strokeWidth="2" />
            </div>
            <div className="auth-notice__tooltip">
                <div className="auth-notice__message">
                    You unlocked my private case studies!
                </div>
                <div>
                    <Link className="button" href="/work" onClick={toggleTooltip}>
                        Go Check 'em Out
                    </Link>
                </div>
                {isLocalhost && (
                    <div>
                        <LogoutButton />
                    </div>
                )}
            </div>
        </div>
    )
}

export default AuthNotice