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
    organization_id?: string
    organization?: {
        id: string
        name: string
        type: string
        hierarchy_settings?: any
    }
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
        // Use URLSearchParams for application/x-www-form-urlencoded
        const params = new URLSearchParams()
        params.append('username', email)
        params.append('password', password)

        const response = await axios.post('http://localhost:8000/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const { access_token } = response.data

        localStorage.setItem('token', access_token)
        setToken(access_token)
        await fetchCurrentUser(access_token)

        // Redirect based on force_password_reset
        if (response.data.force_password_reset) {
            router.push('/change-password')
            return
        }

        // Redirect based on role
        const role = response.data.user_role
        if (role === 'SUPER_ADMIN') {
            router.push('/admin/dashboard')
        } else if (role === 'ORG_ADMIN') {
            router.push('/org/dashboard')
        } else if (['DEPT_HEAD', 'TEACHER'].includes(role)) {
            router.push('/')
        } else {
            router.push('/learn')
        }
    }

    const signup = async (email: string, password: string, fullName: string, role: string = 'STUDENT') => {
        const response = await axios.post('http://localhost:8000/auth/signup', {
            email,
            password,
            full_name: fullName,
            role
        })
        const { access_token, user_role } = response.data

        localStorage.setItem('token', access_token)
        setToken(access_token)
        await fetchCurrentUser(access_token)

        // Redirect based on role
        if (user_role === 'SUPER_ADMIN') {
            router.push('/admin/dashboard')
        } else if (['ORG_ADMIN', 'DEPT_HEAD', 'TEACHER'].includes(user_role)) {
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
        isAdmin: ['SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_HEAD', 'TEACHER'].includes(user?.role || ''),
        isConsumer: user?.role === 'STUDENT',
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
