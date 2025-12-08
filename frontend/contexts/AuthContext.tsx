"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
    id: string
    email: string
    full_name: string | null
    role: string
    is_active: boolean
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, fullName: string, role?: string) => Promise<void>
    logout: () => void
    isAdmin: boolean
    isConsumer: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Load token and user from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            setToken(storedToken)
            fetchCurrentUser(storedToken)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchCurrentUser = async (authToken: string) => {
        try {
            const response = await axios.get('http://localhost:8000/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` }
            })
            setUser(response.data)
        } catch (error) {
            console.error('Failed to fetch user:', error)
            localStorage.removeItem('token')
            setToken(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        const formData = new FormData()
        formData.append('username', email) // OAuth2 uses 'username' field
        formData.append('password', password)

        const response = await axios.post('http://localhost:8000/auth/login', formData)
        const { access_token } = response.data

        localStorage.setItem('token', access_token)
        setToken(access_token)
        await fetchCurrentUser(access_token)

        // Redirect based on role
        if (response.data.role === 'ADMIN') {
            router.push('/')
        } else {
            router.push('/learn')
        }
    }

    const signup = async (email: string, password: string, fullName: string, role: string = 'CONSUMER') => {
        const response = await axios.post('http://localhost:8000/auth/signup', {
            email,
            password,
            full_name: fullName,
            role
        })
        const { access_token } = response.data

        localStorage.setItem('token', access_token)
        setToken(access_token)
        await fetchCurrentUser(access_token)

        // Redirect based on role
        if (role === 'ADMIN') {
            router.push('/')
        } else {
            router.push('/learn')
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        router.push('/login')
    }

    const value = {
        user,
        token,
        login,
        signup,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isConsumer: user?.role === 'CONSUMER',
        loading
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
