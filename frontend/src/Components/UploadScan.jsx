import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Upload as UploadIcon, 
  FileDiff, 
  Users, 
  History, 
  LogOut, 
  Bell, 
  ChevronLeft,
  File,
  X,
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const UploadScan = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [files, setFiles] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigationItems = [
    { icon: <Layout size={20} />, label: 'Dashboard', action: () => navigate('/app/dashboard') },
    { icon: <UploadIcon size={20} />, label: 'Upload Scan', action: () => {} },
    { icon: <FileDiff size={20} />, label: 'Compare Scans', action: () => navigate('/app/compare') },
    { icon: <Users size={20} />, label: 'Patient Records', action: () => {} },
    { icon: <History size={20} />, label: 'History', action: () => {} },
  ];

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(2, 11),
        preview: URL.createObjectURL(file)
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(2, 11),
        preview: URL.createObjectURL(file)
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock response from the server
      const mockResponse = {
        "anomaly_detection": {
          "analysis": "*ANOMALY: YES\n\nThe provided medical scan reveals a significant anomaly in the wrist region. The scan, likely an MRI or CT scan, shows a clear disruption of the normal anatomy of the wrist bones and surrounding soft tissues.\n\nFINDINGS:\n\n   *Location:* The anomaly is primarily located in the distal radius and ulna, with possible involvement of the carpal bones.\n*   *Nature:* The anomaly appears to be a fracture or dislocation, characterized by a discontinuity in the cortical bone and potential displacement of the affected bones.\n*   *Associated Features:* There may be associated soft tissue edema or hematoma, as indicated by increased signal intensity on the T2-weighted images.\n\n*Conclusion:*\n\nThe presence of a fracture or dislocation in the wrist region is a significant anomaly that requires prompt medical attention. Further evaluation and treatment, such as immobilization or surgical intervention, may be necessary to ensure proper healing and prevent long-term complications.",
          "anomaly_detected": true,
          "error": null,
          "findings": [
            {
              "confidence": null,
              "confidence_text": "Based on visual analysis",
              "description": "",
              "location": null,
              "type": "Finding 1"
            },
            {
              "confidence": null,
              "confidence_text": "Based on visual analysis",
              "description": "*   *Location:* The anomaly is primarily located in the distal radius and ulna, with possible involvement of the carpal bones.",
              "location": null,
              "type": "Finding 2"
            },
            {
              "confidence": null,
              "confidence_text": "Based on visual analysis",
              "description": "*   *Nature:* The anomaly appears to be a fracture or dislocation, characterized by a discontinuity in the cortical bone and potential displacement of the affected bones.",
              "location": null,
              "type": "Finding 3"
            },
            {
              "confidence": null,
              "confidence_text": "Based on visual analysis",
              "description": "*   *Associated Features:* There may be associated soft tissue edema or hematoma, as indicated by increased signal intensity on the T2-weighted images.",
              "location": null,
              "type": "Finding 4"
            }
          ],
          "recommendation": "Immediate orthopedic consultation is recommended. Consider immobilization with a splint or cast. Further imaging such as specialized X-rays or additional MRI sequences may be beneficial for surgical planning if indicated."
        }
      };

      setResult(mockResponse);
      setIsLoading(false);
      setShowModal(true);
    }, 2000);
  };

  const ResultModal = () => {
    const anomalyDetection = result?.anomaly_detection;
    const anomalyDetected = anomalyDetection?.anomaly_detected;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
            <button 
              onClick={() => setShowModal(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            <div className="mb-6">
              <div className={`flex items-center p-4 rounded-lg ${anomalyDetected ? 'bg-red-50' : 'bg-green-50'}`}>
                {anomalyDetected ? (
                  <AlertTriangle className="text-red-500 mr-3" size={24} />
                ) : (
                  <CheckCircle className="text-green-500 mr-3" size={24} />
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {anomalyDetected ? 'Anomaly Detected' : 'No Anomaly Detected'}
                  </h3>
                  <p className="text-sm">
                    {anomalyDetected ? 
                      'The scan shows potential abnormalities that require attention' : 
                      'No significant abnormalities detected in this scan'}
                  </p>
                </div>
              </div>
            </div>
            
            {anomalyDetection?.findings && anomalyDetection.findings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Findings</h3>
                <div className="space-y-3">
                  {anomalyDetection.findings.map((finding, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{finding.type}</h4>
                        <span className="text-sm text-gray-500">{finding.confidence_text}</span>
                      </div>
                      <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: finding.description }}></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {anomalyDetection?.analysis && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Detailed Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                  {anomalyDetection.analysis}
                </div>
              </div>
            )}
            
            {anomalyDetection?.recommendation && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Recommendation</h3>
                <div className="bg-blue-50 p-4 rounded-md">
                  {anomalyDetection.recommendation}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-3">
            <button 
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button 
              onClick={() => {
                // Download functionality would go here
                alert("Report download initiated");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Download size={16} className="mr-2" />
              Download Report
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">MediScan AI</h1>
        </div>
        
        <div className="flex flex-col justify-between h-full">
          <div className="p-4">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className={`flex items-center space-x-3 w-full p-3 rounded-md transition ${
                    item.label === 'Upload Scan' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 rounded-md hover:bg-gray-100 transition"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">MediScan AI</h1>
          <div className="flex items-center space-x-4">
            <button className="relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
          </div>
        </div>
        <div className="p-2 border-t flex items-center">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="ml-2 font-medium">Upload Scan</h2>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto pt-4 md:pt-0">
        <div className="h-full flex flex-col">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between p-6 border-b bg-white">
            <h2 className="text-2xl font-bold">Upload Medical Scan</h2>
            <div className="flex items-center space-x-4">
              <button className="relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="font-medium">{user.name || 'User'}</span>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID
              </label>
              <input
                type="text"
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="px-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter patient ID"
              />
            </div>
            
            <div className="flex-1 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Scan Images
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed rounded-lg p-6 h-64 flex flex-col items-center justify-center bg-gray-50 cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                <UploadIcon size={40} className="text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 text-center mb-2">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Supported formats: JPEG, PNG, DICOM
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".jpg,.jpeg,.png,.dcm"
                  className="hidden"
                />
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({files.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-xs truncate mt-1">{file.file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-auto">
              <button
                type="submit"
                disabled={files.length === 0 || isLoading}
                className={`w-full py-3 rounded-md text-white font-medium flex items-center justify-center ${
                  files.length === 0 || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Analyze Scan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Result Modal */}
      <AnimatePresence>
        {showModal && <ResultModal />}
      </AnimatePresence>
    </div>
  );
};

export default UploadScan;