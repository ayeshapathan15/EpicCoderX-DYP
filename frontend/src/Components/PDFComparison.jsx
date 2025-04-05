import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  File, 
  Upload, 
  X, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Loader,
  FileText,
  Search,
  PenTool,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const PDFComparison = () => {
  const [files, setFiles] = useState({
    doc1: null,
    doc2: null
  });
  const [fileNames, setFileNames] = useState({
    doc1: '',
    doc2: ''
  });
  const [previewUrls, setPreviewUrls] = useState({
    doc1: null,
    doc2: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  const handleFileSelect = (e, docKey) => {
    const file = e.target.files[0];
    
    if (file && file.type === 'application/pdf') {
      setFiles(prev => ({ ...prev, [docKey]: file }));
      setFileNames(prev => ({ ...prev, [docKey]: file.name }));
      
      // Create object URL for preview
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, [docKey]: fileUrl }));
      
      // Clear any previous errors
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const clearFile = (docKey) => {
    setFiles(prev => ({ ...prev, [docKey]: null }));
    setFileNames(prev => ({ ...prev, [docKey]: '' }));
    
    // Revoke object URL to prevent memory leaks
    if (previewUrls[docKey]) {
      URL.revokeObjectURL(previewUrls[docKey]);
      setPreviewUrls(prev => ({ ...prev, [docKey]: null }));
    }
  };

  const compareDocuments = async () => {
    // Validate we have both files
    if (!files.doc1 || !files.doc2) {
      setError('Please select two PDF files to compare');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('doc1', files.doc1);
      formData.append('doc2', files.doc2);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setComparison(result);
        setIsModalOpen(true);
      } else {
        setError(result.error || 'An error occurred during comparison');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
      console.error('Error comparing documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Mock comparison data for the visual design
  const mockComparisonData = {
    overview: {
      similarityScore: 68,
      significantChanges: 5,
      minorChanges: 12,
      unchanged: 83
    },
    textual_differences: [
      { type: 'addition', page: 1, section: 'Patient History', text: 'Patient now reports intermittent joint pain.' },
      { type: 'removal', page: 2, section: 'Medication', text: 'Prescribed ibuprofen 400mg twice daily.' },
      { type: 'change', page: 3, section: 'Diagnosis', text: 'Changed diagnosis from "sprain" to "minor fracture".' }
    ],
    visual_changes: [
      { page: 4, description: 'Significant change in bone density visible in right wrist.' },
      { page: 5, description: 'New area of inflammation detected in lower joint.' }
    ],
    progression: {
      trend: 'improving',
      notes: 'Patient shows 35% improvement in joint mobility since last assessment.'
    }
  };

  // Use mock data for demonstration
  const displayData = comparison || mockComparisonData;

  const renderComparisonContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Document Comparison Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Similarity Analysis</h4>
                  <div className="text-2xl font-bold text-blue-600">{displayData.overview.similarityScore}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${displayData.overview.similarityScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Different</span>
                  <span>Identical</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h4 className="font-medium text-gray-800 mb-3">Change Distribution</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Significant Changes</span>
                      <span className="text-sm font-medium text-red-600">{displayData.overview.significantChanges}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${displayData.overview.significantChanges}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Minor Changes</span>
                      <span className="text-sm font-medium text-amber-600">{displayData.overview.minorChanges}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${displayData.overview.minorChanges}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Unchanged</span>
                      <span className="text-sm font-medium text-green-600">{displayData.overview.unchanged}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${displayData.overview.unchanged}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow p-4">
              <h4 className="font-medium text-gray-800 mb-3">Progression Summary</h4>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`rounded-full p-1 ${displayData.progression.trend === 'improving' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {displayData.progression.trend === 'improving' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                </div>
                <p className={`font-medium ${displayData.progression.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                  {displayData.progression.trend === 'improving' ? 'Condition Improving' : 'Condition Worsening'}
                </p>
              </div>
              <p className="text-gray-600 text-sm">{displayData.progression.notes}</p>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Textual Differences</h3>
            <div className="space-y-4">
              {displayData.textual_differences.map((diff, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start">
                    <div className={`mt-1 rounded-full p-1 flex-shrink-0 ${
                      diff.type === 'addition' ? 'bg-green-100 text-green-600' : 
                      diff.type === 'removal' ? 'bg-red-100 text-red-600' : 
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {diff.type === 'addition' ? <PenTool size={16} /> : 
                       diff.type === 'removal' ? <X size={16} /> : 
                       <PenTool size={16} />}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500">Page {diff.page} • {diff.section}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          diff.type === 'addition' ? 'bg-green-100 text-green-600' : 
                          diff.type === 'removal' ? 'bg-red-100 text-red-600' : 
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {diff.type === 'addition' ? 'Added' : 
                           diff.type === 'removal' ? 'Removed' : 
                           'Changed'}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-800">{diff.text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'visual':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Visual Changes</h3>
            {displayData.visual_changes.map((change, index) => (
              <div key={index} className="mb-4 bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Page {change.page}</h4>
                  <span className="text-blue-600 text-sm cursor-pointer hover:underline">View Detail</span>
                </div>
                <p className="text-gray-700">{change.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">Before</div>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                      <FileText size={24} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="border rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">After</div>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                      <FileText size={24} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return <div className="p-6">Select a section to view details</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6">PDF Comparison Tool</h1>
        
        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center"
          >
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
        
        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* First Document */}
          <motion.div 
            whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Document 1</h2>
              {!files.doc1 ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef1.current.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef1}
                    onChange={(e) => handleFileSelect(e, 'doc1')}
                    accept="application/pdf"
                    className="hidden"
                  />
                  <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-100 w-8 h-8 flex items-center justify-center">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div className="ml-2 truncate max-w-xs">
                        <p className="text-sm font-medium text-gray-800 truncate">{fileNames.doc1}</p>
                        <p className="text-xs text-gray-500">
                          {(files.doc1.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => clearFile('doc1')}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <FileText size={24} className="text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">PDF Preview</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Second Document */}
          <motion.div 
            whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Document 2</h2>
              {!files.doc2 ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef2.current.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef2}
                    onChange={(e) => handleFileSelect(e, 'doc2')}
                    accept="application/pdf"
                    className="hidden"
                  />
                  <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-100 w-8 h-8 flex items-center justify-center">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div className="ml-2 truncate max-w-xs">
                        <p className="text-sm font-medium text-gray-800 truncate">{fileNames.doc2}</p>
                        <p className="text-xs text-gray-500">
                          {(files.doc2.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => clearFile('doc2')}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <FileText size={24} className="text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">PDF Preview</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Compare Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={compareDocuments}
            disabled={isLoading || !files.doc1 || !files.doc2}
            className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium text-lg shadow-lg
              ${(isLoading || !files.doc1 || !files.doc2) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
          >
            {isLoading ? (
              <>
                <Loader size={20} className="mr-2 animate-spin" />
                Comparing Documents...
              </>
            ) : (
              <>
                Compare Documents
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </motion.button>
        </div>
        
        {/* Comparison Results Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-50 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Document Comparison Results</h2>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="truncate max-w-xs">{fileNames.doc1}</span>
                      <ArrowRight size={16} className="mx-2" />
                      <span className="truncate max-w-xs">{fileNames.doc2}</span>
                    </div>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex h-[calc(90vh-73px)]">
                  {/* Sidebar Navigation */}
                  <div className="w-64 bg-white border-r overflow-y-auto">
                    <nav className="p-4">
                      <ul className="space-y-1">
                        <li>
                          <button
                            onClick={() => setActiveSection('overview')}
                            className={`w-full flex items-center space-x-3 p-2 rounded-lg ${
                              activeSection === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Layers size={18} className={activeSection === 'overview' ? 'text-blue-700' : 'text-gray-500'} />
                            <span>Overview</span>
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => setActiveSection('text')}
                            className={`w-full flex items-center space-x-3 p-2 rounded-lg ${
                              activeSection === 'text' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <FileText size={18} className={activeSection === 'text' ? 'text-blue-700' : 'text-gray-500'} />
                            <span>Textual Differences</span>
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => setActiveSection('visual')}
                            className={`w-full flex items-center space-x-3 p-2 rounded-lg ${
                              activeSection === 'visual' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Search size={18} className={activeSection === 'visual' ? 'text-blue-700' : 'text-gray-500'} />
                            <span>Visual Changes</span>
                          </button>
                        </li>
                      </ul>
                      
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Document Pages</h3>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                            <span className="text-sm text-gray-600">Page 1</span>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                          <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                            <span className="text-sm text-gray-600">Page 2</span>
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          </div>
                          <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                            <span className="text-sm text-gray-600">Page 3</span>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                        </div>
                      </div>
                    </nav>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    {renderComparisonContent()}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PDFComparison;