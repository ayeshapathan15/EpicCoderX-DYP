import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users,
  FileText,
  Calendar,
  Clock,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const PatientHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 10,
    skip: 0,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Fetch patients (this needs to be implemented with a real API endpoint)
  useEffect(() => {
    const fetchPatients = async () => {
      // Note: This would call your actual patients API endpoint
      // Example: const response = await axios.get('/api/patients', { params: { search: searchTerm } });
      // setPatients(response.data.patients);
      
      // For now, using dummy data since no patients endpoint was provided
      setPatients([
        { patient_id: '123', name: 'Sarah Johnson', age: 42, lastScan: '2025-04-01', condition: 'Wrist Fracture' },
        { patient_id: '456', name: 'Michael Chen', age: 56, lastScan: '2025-03-27', condition: 'Spinal Stenosis' },
        { patient_id: '789', name: 'Emma Rodriguez', age: 34, lastScan: '2025-03-25', condition: 'Torn ACL' },
        { patient_id: '321', name: 'David Wilson', age: 29, lastScan: '2025-03-30', condition: 'Shoulder Dislocation' },
        { patient_id: '654', name: 'Olivia Thompson', age: 51, lastScan: '2025-03-29', condition: 'Osteoarthritis' }
      ].filter(patient => 
        searchTerm === '' || 
        patient.patient_id.includes(searchTerm) || 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    };
    
    fetchPatients();
  }, [searchTerm]);
  
  // Fetch patient reports - updated to use the Python API endpoint
  const fetchPatientReports = async (patientId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/patient/${patientId}/reports`, {
        params: {
          limit: pagination.limit,
          skip: pagination.skip,
          sort: 'created_at',
          order: 'desc'
        }
      });
      
      // Using the response format from the Python API
      setReports(response.data.reports);
      setPagination({
        limit: response.data.limit,
        skip: response.data.skip,
        total: response.data.total
      });
      setActiveTab('reports');
    } catch (error) {
      console.error('Error fetching patient reports:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch specific report details - updated to use the Python API endpoint
  const fetchReportDetails = async (reportId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/report/${reportId}`);
      setSelectedReport(response.data);
      setActiveTab('report-details');
    } catch (error) {
      console.error('Error fetching report details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientReports(patient.patient_id);
  };
  
  const handleReportSelect = (report) => {
    fetchReportDetails(report._id);
  };
  
  const handleBackToReports = () => {
    setActiveTab('reports');
    setSelectedReport(null);
  };
  
  const handleBackToPatients = () => {
    setActiveTab('patients');
    setSelectedPatient(null);
    setReports([]);
  };
  
  const handleNextPage = () => {
    if (pagination.skip + pagination.limit < pagination.total) {
      const newSkip = pagination.skip + pagination.limit;
      setPagination({
        ...pagination,
        skip: newSkip
      });
      fetchPatientReports(selectedPatient.patient_id);
    }
  };
  
  const handlePrevPage = () => {
    if (pagination.skip > 0) {
      const newSkip = Math.max(0, pagination.skip - pagination.limit);
      setPagination({
        ...pagination,
        skip: newSkip
      });
      fetchPatientReports(selectedPatient.patient_id);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">Patient History</h1>
        <p className="text-gray-600">Search and view patient scan history and reports</p>
      </motion.div>
      
      {/* Search & Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 max-w-md">
            <Search size={18} className="text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder={activeTab === 'patients' ? "Search patients by ID or name..." : "Search in reports..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none flex-1 text-sm"
            />
          </div>
          
          <div className="flex">
            <button 
              onClick={() => activeTab !== 'patients' && handleBackToPatients()}
              className={`py-2 px-4 text-sm font-medium rounded-l-lg ${
                activeTab === 'patients' ? 
                'bg-blue-600 text-white' : 
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Patients
            </button>
            <button 
              onClick={() => activeTab !== 'reports' && selectedPatient && fetchPatientReports(selectedPatient.patient_id)}
              disabled={!selectedPatient}
              className={`py-2 px-4 text-sm font-medium rounded-r-lg ${
                activeTab === 'reports' ? 
                'bg-blue-600 text-white' : 
                selectedPatient ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Reports
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'patients' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Patient ID</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Age</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Last Scan</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Condition</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length > 0 ? (
                      patients.map((patient, index) => (
                        <motion.tr 
                          key={patient.patient_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-2 text-sm text-gray-800">{patient.patient_id}</td>
                          <td className="py-3 px-2 text-sm font-medium text-gray-800">{patient.name}</td>
                          <td className="py-3 px-2 text-sm text-gray-800">{patient.age}</td>
                          <td className="py-3 px-2 text-sm text-gray-800">{patient.lastScan}</td>
                          <td className="py-3 px-2 text-sm text-gray-800">{patient.condition}</td>
                          <td className="py-3 px-2 text-right">
                            <button 
                              onClick={() => handlePatientSelect(patient)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View History
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          {searchTerm ? "No patients match your search" : "No patients found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{selectedPatient?.name}'s Reports</h3>
                  <p className="text-sm text-gray-500">Patient ID: {selectedPatient?.patient_id}</p>
                </div>
                <button 
                  onClick={handleBackToPatients}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Back to All Patients
                </button>
              </div>
              
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading reports...</div>
              ) : (
                <>
                  {reports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reports.map((report, index) => (
                        <motion.div
                          key={report._id}
                          custom={index}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          className="bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer"
                          onClick={() => handleReportSelect(report)}
                        >
                          <div className={`p-1 ${report.anomaly_detected ? 'bg-red-100' : 'bg-green-100'}`}>
                            <div className="flex items-center justify-between px-3 py-1">
                              <div className="flex items-center">
                                {report.anomaly_detected ? (
                                  <AlertCircle size={16} className="text-red-500 mr-1" />
                                ) : (
                                  <CheckCircle size={16} className="text-green-500 mr-1" />
                                )}
                                <span className={`text-xs font-medium ${report.anomaly_detected ? 'text-red-700' : 'text-green-700'}`}>
                                  {report.anomaly_detected ? 'Anomaly Detected' : 'No Anomalies'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {report.analysis_result?.scan_type || 'Unknown Scan'}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800 mb-1">{report.scan_filename || 'Unnamed Scan'}</h4>
                                <div className="flex items-center text-xs text-gray-500 mb-2">
                                  <Calendar size={12} className="mr-1" />
                                  <span>{formatDate(report.created_at)}</span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-gray-400" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">No reports found for this patient</div>
                  )}
                  
                  {/* Pagination */}
                  {reports.length > 0 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-500">
                        Showing {pagination.skip + 1} to {Math.min(pagination.skip + reports.length, pagination.total)} of {pagination.total} reports
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={pagination.skip === 0}
                          className={`px-3 py-1 text-sm rounded ${
                            pagination.skip === 0 ? 
                            'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={pagination.skip + pagination.limit >= pagination.total}
                          className={`px-3 py-1 text-sm rounded ${
                            pagination.skip + pagination.limit >= pagination.total ? 
                            'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
          
          {activeTab === 'report-details' && selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Report Details</h3>
                  <p className="text-sm text-gray-500">Scan: {selectedReport.scan_filename}</p>
                </div>
                <button 
                  onClick={handleBackToReports}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Back to Reports
                </button>
              </div>
              
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className={`p-2 ${selectedReport.anomaly_detected ? 'bg-red-100' : 'bg-green-100'}`}>
                  <div className="flex items-center px-3 py-1">
                    {selectedReport.anomaly_detected ? (
                      <AlertCircle size={18} className="text-red-500 mr-2" />
                    ) : (
                      <CheckCircle size={18} className="text-green-500 mr-2" />
                    )}
                    <span className={`font-medium ${selectedReport.anomaly_detected ? 'text-red-700' : 'text-green-700'}`}>
                      {selectedReport.anomaly_detected ? 'Anomaly Detected' : 'No Anomalies'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient ID</p>
                      <p className="font-medium">{selectedReport.patient_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scan Type</p>
                      <p className="font-medium">{selectedReport.analysis_result?.scan_type || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(selectedReport.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Anomaly Analysis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose max-w-none">
                        {selectedReport.analysis_result?.anomaly_detection?.analysis ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: selectedReport.analysis_result.anomaly_detection.analysis.replace(/\n/g, '<br />') 
                          }} />
                        ) : (
                          <p className="text-gray-500">No analysis available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedReport.analysis_result?.anomaly_detection?.findings && 
                   selectedReport.analysis_result.anomaly_detection.findings.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Detailed Findings</h4>
                      <div className="space-y-3">
                        {selectedReport.analysis_result.anomaly_detection.findings.map((finding, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">
                              {finding.description}
                              {finding.confidence_text && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({finding.confidence_text})
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
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
  );
};

export default PatientHistory;