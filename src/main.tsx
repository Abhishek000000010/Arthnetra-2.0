import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FundProvider } from './context/FundContext'
import { AuthProvider } from './context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'missing-google-client-id'}>
      <AuthProvider>
        <FundProvider>
          <App />
        </FundProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
