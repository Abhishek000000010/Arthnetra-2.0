import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FundProvider } from './context/FundContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FundProvider>
      <App />
    </FundProvider>
  </React.StrictMode>,
)
