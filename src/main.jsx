import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// React Query configuration with request cancellation support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Enable request cancellation
      refetchOnWindowFocus: false,
      retry: 1,
      // Stale time - data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache time - unused data stays in cache for 5 minutes
      cacheTime: 5 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--primary-yellow)',
                },
                success: {
                  iconTheme: {
                    primary: '#0ecb81',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f6465d',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

