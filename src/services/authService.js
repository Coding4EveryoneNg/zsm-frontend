import api from './api'
import logger from '../utils/logger'

export const authService = {
  
  try:{
    login: async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe })
    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      if (response.data.expiresAt) {
        localStorage.setItem('tokenExpiry', response.data.expiresAt)
      }
    }
    return response
  }
  },catch (err) {
  if (err.response?.status === 401) {
    setError(err.response.data.message);
  } else {
    setError("Something went wrong");
  }
},

  register: async (userData) => {
    return await api.post('/auth/register', userData)
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
    }
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me')
  },

  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token, email, newPassword, confirmPassword) => {
    return await api.post('/auth/reset-password', {
      token,
      email,
      newPassword,
      confirmPassword,
    })
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    })
  },

  generateOtp: async (email) => {
    return await api.post('/auth/generate-otp', { email })
  },

  verifyOtp: async (email, otp) => {
    return await api.post('/auth/verify-otp', { email, otp })
  },

  confirmEmail: async (token, email) => {
    return await api.post('/auth/confirm-email', { token, email })
  },
}

