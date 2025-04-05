import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import UploadScan from './components/UploadScan';
import CompareScan from './components/CompareScan';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/*" element={
            <ProtectedRoute>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="upload" element={<UploadScan />} />
                <Route path="compare" element={<CompareScan />} />
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
      <Toaster />
    </Router>
  );
};

export default App;