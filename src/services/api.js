import axios from 'axios'
import { isTokenExpired } from '../utils/tokenUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:44362/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds - prevent indefinite hangs
})

// Request interceptor to add auth token and check expiry
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token is expired, clear it and signal session timeout for login page to show message
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('tokenExpiry')
        try {
          sessionStorage.setItem('session_expired', 'true')
        } catch (_) {}
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(new Error('Token expired'))
      }
      
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Return the blob data directly for blob responses (file downloads)
    if (response.config.responseType === 'blob') {
      // Check if the response is actually a blob or an error JSON
      const contentType = response.headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        // This is an error response in JSON format, but axios parsed it as blob
        // We need to read the blob as text first, then parse and reject
        // This will be handled in the error interceptor
        return response.data
      }
      // Return the blob data directly
      return response.data
    }
    // For JSON responses, return data directly
    return response.data
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      try {
        sessionStorage.setItem('session_expired', 'true')
      } catch (_) {}
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // If error response is a blob (when responseType is 'blob' but server returns error as JSON)
    if (error.response?.data instanceof Blob && error.config?.responseType === 'blob') {
      try {
        const text = await error.response.data.text()
        const json = JSON.parse(text)
        return Promise.reject({ 
          ...error, 
          response: { 
            ...error.response, 
            data: json 
          } 
        })
      } catch {
        // If parsing fails, return original errors
        return Promise.reject(error)
      }
    }
    
    // Build a normalized error object so components can reliably access message
    const data = error.response?.data ?? error
    const message = data?.message ?? (Array.isArray(data?.errors) ? data.errors[0] : null) ?? error.message
    const err = new Error(typeof message === 'string' ? message : 'Request failed')
    err.response = error.response
    err.status = error.response?.status ?? error.status
    err.data = data
    err.originalError = error
    return Promise.reject(err)
  }
)

export default api

