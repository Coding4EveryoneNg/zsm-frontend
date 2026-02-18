import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'
import logger from '../utils/logger'

const AuthContext = createContext(null)

/** Normalize user object: ensure role is always set (handles API returning role or Role) */
function normalizeUser(user) {
  if (!user || typeof user !== 'object') return user
  const role = user.role ?? user.Role ?? ''
  return { ...user, role: role || user.role || user.Role }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (token && storedUser) {
        try {
          const userData = normalizeUser(JSON.parse(storedUser))
          setUser(userData)
          setIsAuthenticated(true)
          
          // Verify token and optionally refresh user from API (don't overwrite with bad data)
          try {
            const currentUser = await authService.getCurrentUser()
            const userFromApi = currentUser?.data ?? currentUser
            const isValidUser = userFromApi && (userFromApi.id || userFromApi.Id || userFromApi.role || userFromApi.Role)
            if (isValidUser) {
              const normalized = normalizeUser(userFromApi)
              setUser(normalized)
              localStorage.setItem('user', JSON.stringify(normalized))
            }
          } catch (error) {
            // Interceptor already clears auth and redirects on 401; don't clear on other errors so stored user stays valid
            const status = error?.response?.status ?? error?.status
            if (status === 401) {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              localStorage.removeItem('tokenExpiry')
              setUser(null)
              setIsAuthenticated(false)
            }
            // On network/404/etc. we keep the stored user so student can still reach dashboard
          }
        } catch (error) {
          logger.error('Auth initialization error:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('tokenExpiry')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authService.login(email, password, rememberMe)
      if (response.success) {
        const data = response.data ?? response
        const rawUser = data?.user ?? data?.User ?? data?.data?.user ?? data?.data?.User ?? response.user ?? response.User
        const token = data?.token ?? data?.Token ?? ''
        const expiresAt = data?.expiresAt ?? data?.ExpiresAt
        if (rawUser && token) {
          const user = normalizeUser(rawUser)
          setUser(user)
          setIsAuthenticated(true)
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          if (expiresAt) localStorage.setItem('tokenExpiry', expiresAt)
        }
        toast.success('Login successful!')
        return { success: true, user: rawUser ? normalizeUser(rawUser) : null }
      } else {
        toast.error(response.message || 'Login failed')
        return { success: false, errors: response.errors }
      }
    } catch (error) {
      const message = error.message || error.errors?.[0] || 'Login failed. Please try again.'
      toast.error(message)
      return { success: false, errors: [message] }
    }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  }), [user, loading, isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

