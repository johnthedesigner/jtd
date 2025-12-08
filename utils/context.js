import { createContext } from 'react'
export const PasswordProvider = createContext({
    authLoading: true, // loading state for authentication
    authenticated: false, // authenticated state
    passwordError: false, // passwordError state
    handlePassword: null, // placeholder for function to handle password input
})
