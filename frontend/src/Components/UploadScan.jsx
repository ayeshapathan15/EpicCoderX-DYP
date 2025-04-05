import React, { useState, useRef, useEffect } from 'react';
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
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

const UploadScan = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [files, setFiles] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [reportText, setReportText] = useState('');
  const [patientId, setPatientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const fileInputRef = useRef(null);
  const reportFileInputRef = useRef(null);
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigationItems = [
    { icon: <Layout size={20} />, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: <UploadIcon size={20} />, label: 'Upload Scan', action: () => {} },
    { icon: <FileDiff size={20} />, label: 'Compare Scans', action: () => navigate('/compare') },
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

  const handleReportFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setReportFile({
        file,
        id: Math.random().toString(36).substring(2, 11),
        name: file.name
      });
    }
  };

  const removeFile = (id) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
  };

  const removeReportFile = () => {
    setReportFile(null);
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

  const fetchPatientReports = async () => {
    if (!patientId) return;
    
    setIsLoadingReports(true);
    setError(null);
    
    try {
      const response = await fetch(`http:://localhost:5000/api/patient/${patientId}/reports`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch patient reports');
      }
      
      const data = await response.json();
      setPatientReports(data.reports || []);
      setShowHistoryModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadReport = async (reportId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http:://localhost:5000/api/report/${reportId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load report');
      }
      
      const data = await response.json();
      setResult(data.analysis_result);
      setShowHistoryModal(false);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one scan file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create form data to send to the API
      const formData = new FormData();
      
      // Add the scan file
      formData.append('scan', files[0].file);
      
      // Add patient ID if available
      if (patientId) {
        formData.append('patient_id', patientId);
      }
      
      // Add either the report file or report text
      if (reportFile) {
        formData.append('report', reportFile.file);
      } else if (reportText) {
        formData.append('report_text', reportText);
      }
      
      // Make the API call
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze scan');
      }
      
      const data = await response.json();
      setResult(data);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  const HistoryModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Patient Report History</h2>
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {isLoadingReports ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : patientReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <File size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No reports found for this patient</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientReports.map((report) => (
                  <div 
                    key={report._id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => loadReport(report._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${report.anomaly_detected ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <h3 className="font-medium">{report.scan_filename}</h3>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        {report.anomaly_detected ? 'Anomaly Detected' : 'No Anomaly Detected'}
                      </span>
                      <button className="text-xs text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Close
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
      <div className="flex-1 overflow-auto pt-16 md:pt-0">
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
              <div className="flex justify-between items-end">
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID
                </label>
                {patientId && (
                  <button
                    type="button"
                    onClick={fetchPatientReports}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <History size={14} className="mr-1" />
                    View History
                  </button>
                )}
              </div>
              <input
                type="text"
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter patient ID"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Medical Scan
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.dcm,.nii,.nii.gz"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {files.length === 0 ? (
                  <>
                    <UploadIcon size={48} className="text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">
                      Drag & drop your scan files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: PNG, JPG, JPEG, DICOM, NIfTI
                    </p>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Selected Files</h3>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                        }}
                        className="text-sm text-blue-600"
                      >
                        Add More
                      </button>
                    </div>
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={file.preview} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded-md bg-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/api/placeholder/48/48";
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium">{file.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Report (Optional)
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="uploadReport"
                        name="reportType"
                        checked={reportFile !== null}
                        onChange={() => {
                          if (!reportFile) {
                            reportFileInputRef.current.click();
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="uploadReport" className="text-sm font-medium">
                        Upload Report File
                      </label>
                    </div>
                    <input
                      ref={reportFileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={handleReportFileChange}
                      className="hidden"
                    />
                    {reportFile ? (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-sm truncate">{reportFile.name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={removeReportFile}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reportFileInputRef.current.click()}
                        className="flex items-center justify-center w-full p-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-500">
                          Click to upload
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="enterReport"
                        name="reportType"
                        checked={reportFile === null}
                        onChange={() => {
                          if (reportFile) {
                            setReportFile(null);
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="enterReport" className="text-sm font-medium">
                        Enter Report Text
                      </label>
                    </div>
                    <textarea
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Enter medical report text..."
                      className="w-full p-2 border border-gray-300 rounded-md resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={reportFile !== null}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="mt-auto">
              <button
                type="submit"
                disabled={isLoading || files.length === 0}
                className={`w-full py-3 rounded-md font-medium text-white ${
                  isLoading || files.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Scan...
                  </div>
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
      
      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && <HistoryModal />}
      </AnimatePresence>
    </div>
  );
};

export default UploadScan;