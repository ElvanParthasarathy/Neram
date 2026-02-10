import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId="85578742222-najemndk98419o1ncihgejeoltks3nlk.apps.googleusercontent.com">
            <AdminApp />
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
