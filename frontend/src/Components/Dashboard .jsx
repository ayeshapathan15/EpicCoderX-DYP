import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Upload,
  FileDiff,
  Users,
  History,
  LogOut,
  Bell,
  Search,
  FileText,
  Zap
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigationItems = [
    { icon: <Layout size={20} />, label: 'Dashboard', action: () => { } },
    { icon: <Upload size={20} />, label: 'Upload Scan', action: () => navigate('/upload') },
    { icon: <FileDiff size={20} />, label: 'Compare Scans', action: () => navigate('/compare') },
    { icon: <Users size={20} />, label: 'Patient Records', action: () => navigate('/patient-history') },
    { icon: <History size={20} />, label: 'History', action: () => navigate('/patient-history') },
    {
      icon: <Users size={20} />,
      label: '3D Visualization',
      action: () => window.open('file:///home/pallav/Documents/GitHub/EpicCoderX-DYP/ImageTo3D.html', '_blank')
    }

  ];

  const recentPatients = [
    { id: 'P-12345', name: 'Sarah Johnson', age: 42, lastScan: '2025-03-28', condition: 'Wrist Fracture' },
    { id: 'P-12346', name: 'Michael Chen', age: 56, lastScan: '2025-03-27', condition: 'Spinal Stenosis' },
    { id: 'P-12347', name: 'Emma Rodriguez', age: 34, lastScan: '2025-03-25', condition: 'Torn ACL' },
  ];

  const recentActivities = [
    { type: 'upload', patient: 'Sarah Johnson', time: '2 hours ago', details: 'MRI Scan uploaded' },
    { type: 'analysis', patient: 'Michael Chen', time: '1 day ago', details: 'Anomaly detected in CT Scan' },
    { type: 'comparison', patient: 'Emma Rodriguez', time: '2 days ago', details: 'Recovery progress: 65%' },
  ];

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 bg-white shadow-lg hidden md:flex flex-col"
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-700">MedVisor AI</h2>
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
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg ${index === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className={index === 0 ? 'text-blue-700' : 'text-gray-500'}>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center md:hidden">
              <button className="text-gray-500">
                <Layout size={24} />
              </button>
              <h2 className="ml-3 text-lg font-medium">Dashboard</h2>
            </div>

            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 max-w-md">
              <Search size={18} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search patients or scans..."
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, {user.name?.split(' ')[0] || 'Doctor'}</h1>
          </motion.div>

          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/app/upload')}
              >
                <div className="p-6">
                  <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4">
                    <Upload size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Scan</h3>
                  <p className="text-blue-100">Upload medical scans for AI analysis</p>
                </div>
              </motion.div>

              <motion.div
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/app/compare')}
              >
                <div className="p-6">
                  <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4">
                    <FileDiff size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Compare Scans</h3>
                  <p className="text-indigo-100">Track patient progress between scans</p>
                </div>
              </motion.div>

              <motion.div
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="p-6">
                  <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">View Reports</h3>
                  <p className="text-purple-100">Access past analysis reports</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Patients */}
            <motion.section
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Patients</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Patient</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Age</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Last Scan</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Condition</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((patient, index) => (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 text-sm text-gray-800">{patient.id}</td>
                        <td className="py-3 px-2 text-sm font-medium text-gray-800">{patient.name}</td>
                        <td className="py-3 px-2 text-sm text-gray-800">{patient.age}</td>
                        <td className="py-3 px-2 text-sm text-gray-800">{patient.lastScan}</td>
                        <td className="py-3 px-2 text-sm text-gray-800">{patient.condition}</td>
                        <td className="py-3 px-2 text-right">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All Patients</button>
              </div>
            </motion.section>

            {/* Recent Activity */}
            <motion.section
              custom={4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h2>
              <ul className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center mt-1 
                        ${activity.type === 'upload' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'analysis' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-purple-100 text-purple-600'}`}>
                      {activity.type === 'upload' ? <Upload size={16} /> :
                        activity.type === 'analysis' ? <Zap size={16} /> :
                          <FileDiff size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{activity.details}</p>
                      <p className="text-xs text-gray-500">
                        Patient: {activity.patient} • {activity.time}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All Activity</button>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;