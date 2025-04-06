import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import LandingPage from './Components/LandingPage';
import LoginPage from './Components/LoginPage';
import Dashboard from './Components/Dashboard ';
import UploadScan from './Components/UploadScan';
import PDFComparison from './Components/PDFComparison';
import PatientHistory from './Components/PatientHistory';
import ImageTo3DConverter from './Components/ImageTo3DConverter';
// import CompareScan from './Components/CompareScan';
// import ProtectedRoute from './Components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      {/* <AnimatePresence mode="wait"> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/app" element={<Navigate to="/app/dashboard" replace />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadScan />} />
        <Route path="/compare" element={<PDFComparison />} />
        <Route path="/patient-history" element={<PatientHistory />} />
        <Route path="/3d" element={<ImageTo3DConverter />} />
      </Routes>
      {/* </AnimatePresence> */}
      {/* <Toaster /> */}
    </Router>
  );
};

export default App;