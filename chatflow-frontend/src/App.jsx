// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Chat from './components/Chat/ChatWindow';
import { useAuth } from './context/AuthContext';
import ChatWindow from './components/Chat/ChatWindow';
import { ThemeProvider } from './context/ThemeContext';
import OTPRegister from './components/Auth/OTPRegister';
import EmailVerification from './components/Auth/EmailVerification';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to chat if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Navigate to="/chat" /> : children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register-otp" 
          element={
            <PublicRoute>
              <OTPRegister />
            </PublicRoute>
          } 
        />
        <Route 
          path="/verify-email" 
          element={
            <PublicRoute>
              <EmailVerification />
            </PublicRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-otp" element={<OTPRegister />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/chat" />} />
          </Routes>
        </Router>
      </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;