import { useState } from 'react'

import './App.css'
// import React, { useState } from 'react';
import { Upload, X, File, Download, Check, Clipboard, FileText, User, Info } from 'lucide-react';

function App() {

  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  
  
    const handleFileChange = (e) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        setFiles([...files, ...newFiles]);
      }
    };
  
    // Remove file from selection
    const removeFile = (indexToRemove) => {
      setFiles(files.filter((_, index) => index !== indexToRemove));
    };
  
    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    };
  
    // Copy URL to clipboard
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    };
  
    // Mock API call to /scan endpoint
    const handleScanSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // Mock API response
        const mockResponse = {
          patientId,
          patientName,
          scanDate: new Date().toISOString(),
          fileCount: files.length,
          results: {
            diagnosis: "Normal scan results",
            findings: [
              "No abnormalities detected",
              "All parameters within normal range"
            ],
            recommendations: "Follow-up scan in 6 months",
            doctorNotes: "Patient appears to be in good health based on scan results.",
            metrics: {
              clarity: 0.95,
              confidence: 0.92,
              processingTime: "1.2s"
            }
          }
        };
        
        setScanResults(mockResponse);
        setIsLoading(false);
      }, 1500);
    };
  
    // Generate and upload PDF report
    const generatePdfReport = () => {
      setIsLoading(true);
      
      // Simulate PDF generation and Cloudinary upload
      setTimeout(() => {
        // Mock Cloudinary URL
        const mockCloudinaryUrl = `https://res.cloudinary.com/demo/image/upload/v${Math.floor(Date.now()/1000)}/patient_${patientId}_report.pdf`;
        setCloudinaryUrl(mockCloudinaryUrl);
        
        // Simulate POST to /save endpoint with MongoDB data
        const saveData = {
          patientId,
          patientName,
          reportUrl: mockCloudinaryUrl,
          timestamp: new Date().toISOString()
        };
        
        console.log("Saving to MongoDB:", saveData);
        setUploadSuccess(true);
        setIsLoading(false);
      }, 2000);
    };
  
    // Get file type icon based on mime type or extension
    const getFileIcon = (fileName) => {
      const extension = fileName.split('.').pop().toLowerCase();
      if (['pdf'].includes(extension)) {
        return <FileText size={18} className="text-red-500" />;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        return <File size={18} className="text-blue-500" />;
      } else {
        return <File size={18} className="text-gray-500" />;
      }
    };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="p-2 rounded-lg bg-blue-100 mr-3">
            <FileText size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Medical Document Scanner</h1>
        </div>
        <p className="text-sm text-gray-600 ml-12">Upload patient scans and generate comprehensive reports</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - JSON Results */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Info size={18} className="mr-2" />
              Scan Results
            </h2>
          </div>
          
          {scanResults ? (
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6 overflow-auto max-h-96 border border-blue-100">
                <pre className="text-sm font-mono text-gray-800">
                  {JSON.stringify(scanResults, null, 2)}
                </pre>
              </div>
              
              <button
                onClick={generatePdfReport}
                disabled={isLoading}
                className="flex items-center justify-center w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:bg-blue-300 transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Generate PDF Report
                  </>
                )}
              </button>
              
              {cloudinaryUrl && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Check size={16} className="mr-2 text-green-500" />
                    Report Generated Successfully
                  </p>
                  <div className="flex items-center justify-between bg-white rounded-md border border-gray-200 p-2">
                    <p className="text-xs text-gray-600 truncate pr-2">{cloudinaryUrl}</p>
                    <button 
                      onClick={() => copyToClipboard(cloudinaryUrl)}
                      className="ml-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                    >
                      <Clipboard size={16} className="text-blue-500" />
                    </button>
                  </div>
                  {urlCopied && (
                    <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <div className="mb-4 p-3 rounded-full bg-blue-100">
                <FileText size={24} className="text-blue-500" />
              </div>
              <p className="text-gray-500 text-center">Submit a scan to view analysis results</p>
              <p className="text-gray-400 text-xs text-center mt-2">Patient data and scan results will appear here</p>
            </div>
          )}
        </div>
        
        {/* Right Panel - Form & File Upload */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <User size={18} className="mr-2" />
              Patient Information
            </h2>
          </div>
          
          <form onSubmit={handleScanSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID
                </label>
                <input
                  type="text"
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter patient ID"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter patient name"
                  required
                />
              </div>
            </div>
            
            {/* File Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Scan Documents
              </label>
              
              <div className="mt-1 flex justify-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 p-2 bg-white rounded-full border border-gray-200">
                    <Upload className="h-full w-full text-blue-500" />
                  </div>
                  <div className="flex flex-col text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag and drop files or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG up to 10MB each
                  </p>
                </div>
              </div>
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Files ({files.length})
                </h3>
                <ul className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 overflow-hidden">
                  {files.map((file, index) => (
                    <li key={index} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-gray-100">
                      <div className="flex items-center max-w-full overflow-hidden">
                        <div className="p-2 bg-white rounded-md border border-gray-200 mr-3">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="truncate">
                          <p className="text-gray-900 font-medium truncate">{file.name}</p>
                          <p className="text-gray-500 text-xs">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-4 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:bg-red-100 focus:text-red-500 transition-colors duration-200"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || files.length === 0}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Processing...' : 'Submit Scan'}
              </button>
            </div>
          </form>
          
          {uploadSuccess && (
            <div className="px-6 pb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Data successfully saved to database
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Patient records updated with scan details and report URL
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default App
