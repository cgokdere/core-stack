import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/geist';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { MotionRoot } from './components/motion.jsx';
import { ToastProvider } from './components/toast.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MotionRoot>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MotionRoot>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
