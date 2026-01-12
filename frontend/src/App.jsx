import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FormProvider, useForm } from './contexts/FormContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormPreview from './pages/FormPreview';
import FormResponses from './pages/FormResponses';
import MyForms from './pages/MyForms';
import Profile from './pages/Profile';
import ActivityLogs from './pages/ActivityLogs';
import PublicForm from './pages/PublicForm';
import QRRedirect from './pages/QRRedirect';
import MapTest from './pages/MapTest';
import VerifyOtp from './pages/VerifyOtp';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/form-builder/:formId?" element={
                <ProtectedRoute>
                  <FormBuilder />
                </ProtectedRoute>
              } />
              <Route path="/form-preview/:formId" element={
                <ProtectedRoute>
                  <FormPreview />
                </ProtectedRoute>
              } />
              <Route path="/form-responses/:formId" element={
                <ProtectedRoute>
                  <FormResponses />
                </ProtectedRoute>
              } />
              <Route path="/my-forms" element={
                <ProtectedRoute>
                  <MyForms />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/activity-logs" element={
                <ProtectedRoute>
                  <ActivityLogs />
                </ProtectedRoute>
              } />
              {/* Public form filling route - no authentication required */}
              <Route path="/form/:formId" element={<PublicForm />} />
              {/* QR Code redirect handler - redirects to backend */}
              <Route path="/q/:token" element={<QRRedirect />} />
              {/* OTP verification route - public */}
              <Route path="/verify-otp" element={<VerifyOtp />} />
              {/* Map testing route - for debugging Google Maps API issues */}
              <Route path="/map-test" element={<MapTest />} />
            </Routes>
          </div>
        </Router>
      </FormProvider>
    </AuthProvider>
  );
}

export default App;
