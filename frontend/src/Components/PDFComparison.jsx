import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileDiff,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Layout,
  Users,
  History,
  LogOut,
  Bell,
  Search,
  FileText,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PDFComparison = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rawApiResponse, setRawApiResponse] = useState(null);

  const navigationItems = [
    { icon: <Layout size={20} />, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: <Upload size={20} />, label: 'Upload Scan', action: () => navigate('/upload') },
    { icon: <FileDiff size={20} />, label: 'Compare Scans', action: () => { } },
    { icon: <Users size={20} />, label: 'Patient Records', action: () => navigate('/patients') },
    { icon: <History size={20} />, label: 'History', action: () => navigate('/history') },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file =>
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length !== selectedFiles.length) {
      toast.error('Only PDF files are allowed');
    }

    setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Reset comparison result when files change
    if (files.length < 2) {
      setComparisonResult(null);
      setRawApiResponse(null);
    }
  }, [files]);

  // Enhanced transformation function to better handle API response
  // Enhanced transformation function to better handle API response
  const transformApiResponse = (apiData) => {
    // Store raw response for debugging
    setRawApiResponse(apiData);

    // Basic structure for transformed data
    const transformedData = {
      summary: {
        similarityScore: Math.round((apiData.overall_similarity || 0) * 100),
        keyFindings: [],
        recommendations: []
      },
      differences: []
    };

    // Extract data from the API response
    if (apiData.progress_report) {
      const progressReport = apiData.progress_report;

      // Add progress summary to key findings
      if (progressReport.progress_summary) {
        transformedData.summary.keyFindings.push(progressReport.progress_summary);
      }

      // Add similarity interpretation to key findings
      if (progressReport.similarity_interpretation) {
        transformedData.summary.keyFindings.push(progressReport.similarity_interpretation);
      }

      // Add recovery metrics to key findings if they exist
      if (progressReport.recovery_metrics) {
        const metrics = progressReport.recovery_metrics;

        if (metrics.overall_recovery_percentage > 0) {
          transformedData.summary.keyFindings.push(`Overall recovery: ${metrics.overall_recovery_percentage}%`);
        }

        if (metrics.bone_healing_percentage > 0) {
          transformedData.summary.keyFindings.push(`Bone healing progress: ${metrics.bone_healing_percentage}%`);
        }

        if (metrics.symptoms_improvement_percentage > 0) {
          transformedData.summary.keyFindings.push(`Symptoms improvement: ${metrics.symptoms_improvement_percentage}%`);
        }

        // Add any key indicators
        if (metrics.key_indicators && metrics.key_indicators.length > 0) {
          metrics.key_indicators.forEach(indicator => {
            transformedData.summary.keyFindings.push(indicator);
          });
        }
      }

      // Add treatment recommendations
      if (progressReport.treatment_recommendations) {
        transformedData.summary.recommendations = progressReport.treatment_recommendations;
      }

      // Process document changes
      if (progressReport.changes) {
        const changes = progressReport.changes;

        // Check if there are actual changes
        if ((changes.added && Object.keys(changes.added).length > 0) ||
          (changes.removed && Object.keys(changes.removed).length > 0)) {

          // Process added items
          if (changes.added && Object.keys(changes.added).length > 0) {
            Object.entries(changes.added).forEach(([category, items]) => {
              if (Array.isArray(items)) {
                items.forEach(item => {
                  transformedData.differences.push({
                    category,
                    doc1: '',
                    doc2: item,
                    significance: 'high'
                  });
                });
              } else if (typeof items === 'object') {
                Object.entries(items).forEach(([key, value]) => {
                  transformedData.differences.push({
                    category: `${category} - ${key}`,
                    doc1: '',
                    doc2: value,
                    significance: 'high'
                  });
                });
              }
            });
          }

          // Process removed items
          if (changes.removed && Object.keys(changes.removed).length > 0) {
            Object.entries(changes.removed).forEach(([category, items]) => {
              if (Array.isArray(items)) {
                items.forEach(item => {
                  transformedData.differences.push({
                    category,
                    doc1: item,
                    doc2: '',
                    significance: 'medium'
                  });
                });
              } else if (typeof items === 'object') {
                Object.entries(items).forEach(([key, value]) => {
                  transformedData.differences.push({
                    category: `${category} - ${key}`,
                    doc1: value,
                    doc2: '',
                    significance: 'medium'
                  });
                });
              }
            });
          }
        }
      }
    }

    // If no key findings were found, provide a default message
    if (transformedData.summary.keyFindings.length === 0) {
      transformedData.summary.keyFindings.push("No significant changes in conditions or findings were detected.");
      transformedData.summary.keyFindings.push("The documents are highly similar, but they may still contain important differences in medical details.");
    }

    // If no differences were found in the API response, leave as empty array
    // Rather than filling with demo data

    return transformedData;
  };

  const handleCompare = async () => {
    if (files.length < 2) {
      toast.error('At least two PDF files are required for comparison');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setComparisonResult(null); // Reset previous results
    setRawApiResponse(null);

    // Create form data
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`doc${index + 1}`, file);
    });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 15);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);

      // Make actual API request to the specified endpoint
      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      // Transform API result to match component expectations
      const transformedResult = transformApiResponse(data);

      // Update the state with the transformed result
      setComparisonResult(transformedResult);

      toast.success('Documents compared successfully');
    } catch (error) {
      toast.error(error.message || 'An error occurred during comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  const renderSignificanceBadge = (level) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-700'}`}>
        {level?.toUpperCase()}
      </span>
    );
  };

  const handleDownloadReport = () => {
    if (!comparisonResult) return;

    // Create report content
    let reportContent = `PDF Comparison Report\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    reportContent += `# Summary\n`;
    reportContent += `Similarity Score: ${comparisonResult.summary.similarityScore}%\n\n`;

    reportContent += `## Key Findings\n`;
    comparisonResult.summary.keyFindings.forEach((finding, i) => {
      reportContent += `${i + 1}. ${finding}\n`;
    });
    reportContent += `\n`;

    reportContent += `## Recommendations\n`;
    comparisonResult.summary.recommendations.forEach((rec, i) => {
      reportContent += `${i + 1}. ${rec}\n`;
    });
    reportContent += `\n`;

    reportContent += `# Differences\n`;
    comparisonResult.differences.forEach((diff, i) => {
      reportContent += `## Difference ${i + 1} (${diff.significance.toUpperCase()})\n`;
      reportContent += `Category: ${diff.category}\n`;
      reportContent += `Document 1: ${diff.doc1}\n`;
      reportContent += `Document 2: ${diff.doc2}\n\n`;
    });

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-comparison-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {showSidebar && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-64 bg-white shadow-lg hidden md:flex flex-col"
        >
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-blue-700">MedAI Scan</h2>
            <p className="text-sm text-gray-500">AI-Powered Diagnostics</p>
          </div>

          <div className="p-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user.name ? user.name.charAt(0) : 'D'}
              </div>
              <div>
                <p className="font-medium">{user.name || 'Dr. Jane Smith'}</p>
                <p className="text-xs text-gray-500">{user.role || 'Radiologist'}</p>
              </div>
            </div>

            <nav>
              <ul className="space-y-1">
                {navigationItems.map((item, index) => (
                  <li key={index}>
                    <motion.button
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.action}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg ${index === 2 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className={index === 2 ? 'text-blue-700' : 'text-gray-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </motion.button>
                  </li>
                ))}
                <li className="pt-4 mt-4 border-t">
                  <motion.button
                    whileHover={{ backgroundColor: '#fee2e2' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </motion.button>
                </li>
              </ul>
            </nav>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="md:hidden text-gray-500 mr-3"
              >
                <Layout size={24} />
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} className="mr-1" />
                  <span>Back to Dashboard</span>
                </button>
                <h1 className="text-xl font-bold text-gray-800">Compare Medical Reports</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 max-w-md mx-6">
              <Search size={18} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search comparisons..."
                className="bg-transparent border-0 outline-none flex-1 text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-1 rounded-full hover:bg-gray-100">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="md:hidden">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {user.name ? user.name.charAt(0) : 'D'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-gray-600">Upload and compare medical PDF reports to identify changes and track progress.</p>
            </motion.div>

            {/* Upload Section */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-md p-6 mb-6"
            >
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-blue-100 w-10 h-10 flex items-center justify-center mr-4">
                  <FileDiff size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-800">Upload PDF Reports</h2>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center"
                >
                  <Upload size={36} className="text-gray-400 mb-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF files only (max 50MB per file)</p>
                  </div>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="rounded-full bg-blue-100 w-8 h-8 flex items-center justify-center mr-3">
                            <FileText size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-500 hover:text-red-600"
                          disabled={isLoading}
                        >
                          <AlertCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompare}
                  disabled={files.length < 2 || isLoading}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[200px]
                    ${files.length < 2 || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white mr-2"></div>
                      Comparing...
                    </>
                  ) : (
                    <>Compare Reports</>
                  )}
                </motion.button>
              </div>

              {isLoading && (
                <div className="mt-6">
                  <div className="flex justify-between mb-1 text-xs text-gray-600">
                    <span>Analyzing documents...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Results Section */}
            {comparisonResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center p-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={24} className="text-green-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-800">Comparison Complete</h3>
                    <p className="text-sm text-green-700">The medical reports have been successfully analyzed and compared.</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                  <div className="border-b flex">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`px-6 py-4 text-sm font-medium ${activeTab === 'summary'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('differences')}
                      className={`px-6 py-4 text-sm font-medium ${activeTab === 'differences'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Differences
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-6 py-4 text-sm font-medium ${activeTab === 'raw'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Raw Data
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'summary' && comparisonResult.summary && (
                      <div className="space-y-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-4">Overall Similarity</h3>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full transition-all duration-1000 ${comparisonResult.summary.similarityScore > 80
                                ? 'bg-green-500'
                                : comparisonResult.summary.similarityScore > 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                }`}
                              style={{ width: `${comparisonResult.summary.similarityScore}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-2 text-sm text-gray-600">
                            <span>0%</span>
                            <span className="font-medium">{comparisonResult.summary.similarityScore}%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-5 rounded-lg">
                            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                              <Zap size={18} className="text-yellow-500 mr-2" />
                              Key Findings
                            </h3>
                            <ul className="space-y-2">
                              {comparisonResult.summary.keyFindings.map((finding, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs mr-2 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-700">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gray-50 p-5 rounded-lg">
                            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                              <FileText size={18} className="text-blue-500 mr-2" />
                              Recommendations
                            </h3>
                            <ul className="space-y-2">
                              {comparisonResult.summary.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs mr-2 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex justify-center mt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDownloadReport}
                            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center"
                          >
                            <Download size={16} className="mr-2" />
                            Download Report
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'differences' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Document Differences</h3>
                        <div className="space-y-4">
                          {comparisonResult.differences.map((diff, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-800">{diff.category}</span>
                                </div>
                                <div>
                                  {renderSignificanceBadge(diff.significance)}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                                <div className="p-4">
                                  <h4 className="text-xs font-medium text-gray-500 mb-2">Document 1</h4>
                                  <p className="text-sm text-gray-700">{diff.doc1 || 'No content in this section'}</p>
                                </div>
                                <div className="p-4">
                                  <h4 className="text-xs font-medium text-gray-500 mb-2">Document 2</h4>
                                  <p className="text-sm text-gray-700">{diff.doc2 || 'No content in this section'}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'raw' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Raw API Data</h3>
                        <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px]">
                          <pre className="text-xs text-gray-700">
                            {rawApiResponse ? JSON.stringify(rawApiResponse, null, 2) : 'No raw data available'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFComparison;
