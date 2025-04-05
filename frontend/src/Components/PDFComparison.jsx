import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileDiff, Download, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PDFComparison = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

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

  const transformApiResponse = (apiData) => {
    // Basic structure for transformed data
    const transformedData = {
      summary: {
        similarityScore: Math.round(apiData.overall_similarity * 100),
        keyFindings: [],
        recommendations: []
      },
      differences: []
    };

    // Add progress summary to key findings
    if (apiData.progress_report && apiData.progress_report.progress_summary) {
      transformedData.summary.keyFindings.push(apiData.progress_report.progress_summary);
    }

    // Add similarity interpretation to key findings
    if (apiData.progress_report && apiData.progress_report.similarity_interpretation) {
      transformedData.summary.keyFindings.push(apiData.progress_report.similarity_interpretation);
    }

    // Add recovery metrics to key findings if they exist
    if (apiData.progress_report && apiData.progress_report.recovery_metrics) {
      const metrics = apiData.progress_report.recovery_metrics;
      
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

    // If no key findings were added, provide a default message
    if (transformedData.summary.keyFindings.length === 0) {
      transformedData.summary.keyFindings.push("No specific findings detected in the comparison.");
    }

    // Add treatment recommendations
    if (apiData.progress_report && apiData.progress_report.treatment_recommendations) {
      transformedData.summary.recommendations = apiData.progress_report.treatment_recommendations;
    }

    // Process differences from changes
    if (apiData.progress_report && apiData.progress_report.changes) {
      const changes = apiData.progress_report.changes;
      
      // Process added items
      if (changes.added) {
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
      if (changes.removed) {
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
      
      // Add persisting items for completeness if needed
      if (changes.persisting && Object.keys(changes.persisting).length > 0) {
        Object.entries(changes.persisting).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              transformedData.differences.push({
                category,
                doc1: item,
                doc2: item,
                significance: 'low'
              });
            });
          } else if (typeof items === 'object') {
            Object.entries(items).forEach(([key, value]) => {
              transformedData.differences.push({
                category: `${category} - ${key}`,
                doc1: value,
                doc2: value,
                significance: 'low'
              });
            });
          }
        });
      }
    }

    // Handle case where no differences were found
    if (transformedData.differences.length === 0) {
      transformedData.differences.push({
        category: 'General',
        doc1: 'No significant differences detected',
        doc2: 'No significant differences detected',
        significance: 'low'
      });
    }

    return transformedData;
  };

  const handleCompare = async () => {
    if (files.length < 2) {
      toast.error('At least two PDF files are required for comparison');
      return;
    }

    setIsLoading(true);
    setProgress(0);

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

      // Make API request
      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare documents');
      }

      const apiResult = await response.json();
      
      // Transform API result to match component expectations
      const transformedResult = transformApiResponse(apiResult);
      setComparisonResult(transformedResult);
      
      // Store comparison result in MongoDB
      await fetch('/api/store-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comparisonResult: apiResult,
          documentNames: files.map(file => file.name),
          timestamp: new Date().toISOString(),
        }),
      });

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
      reportContent += `${i+1}. ${finding}\n`;
    });
    reportContent += `\n`;
    
    reportContent += `## Recommendations\n`;
    comparisonResult.summary.recommendations.forEach((rec, i) => {
      reportContent += `${i+1}. ${rec}\n`;
    });
    reportContent += `\n`;
    
    reportContent += `# Differences\n`;
    comparisonResult.differences.forEach((diff, i) => {
      reportContent += `## Difference ${i+1} (${diff.significance.toUpperCase()})\n`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Compare Medical Reports</h1>
          </div>
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
                        <FileDiff size={16} className="text-blue-600" />
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
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000" 
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
                        <h3 className="text-md font-medium text-gray-800 mb-3">Key Findings</h3>
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
                        <h3 className="text-md font-medium text-gray-800 mb-3">Recommendations</h3>
                        <ul className="space-y-2">
                          {comparisonResult.summary.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 flex-shrink-0 flex items-center justify-center text-xs mr-2 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={handleDownloadReport}
                        className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        <Download size={16} className="mr-2" />
                        Download Full Report
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'differences' && comparisonResult.differences && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document 1</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document 2</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Significance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {comparisonResult.differences.map((diff, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{diff.category}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words">{diff.doc1}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words">{diff.doc2}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{renderSignificanceBadge(diff.significance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'raw' && (
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-xs text-gray-700">{JSON.stringify(comparisonResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PDFComparison;