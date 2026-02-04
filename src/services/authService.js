import api from './api'
import logger from '../utils/logger'

export const authService = {
  login: async (email, password, rememberMe = false) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
      rememberMe,
    });

    const data = response.data;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.expiresAt) {
      localStorage.setItem('tokenExpiry', data.expiresAt);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    const data = error.response?.data ?? error
    const message = data?.message ?? (Array.isArray(data?.errors) && data.errors[0]) ?? 'Invalid email or password'
    return {
      success: false,
      message: typeof message === 'string' ? message : 'Invalid email or password',
      errors: Array.isArray(data?.errors) ? data.errors : (data?.message ? [data.message] : [])
    }
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

