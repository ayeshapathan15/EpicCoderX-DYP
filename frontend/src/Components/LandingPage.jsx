import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { motion, useAnimation } from 'framer-motion';
import { 
  ArrowRight, Brain, Activity, Users, FileText, 
  BarChart3, MapPin, Sparkles, BookOpen, Hospital,
  ShieldCheck, ClipboardCheck, HeartPulse, Cpu
} from 'lucide-react';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const controls = useAnimation();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 100) {
        controls.start("visible");
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  const features = [
    {
      icon: <Brain size={28} className="text-blue-600" />,
      title: "AI-Powered Medical Scan Analysis",
      description: "Advanced AI models including VAE for anomaly detection and Llama Vision API for comprehensive medical scan analysis."
    },
    {
      icon: <BarChart3 size={28} className="text-indigo-600" />,
      title: "Patient Progress Tracking",
      description: "Securely store and retrieve medical scans and patient history to monitor progress and recovery over time."
    },
    {
      icon: <Users size={28} className="text-purple-600" />,
      title: "Doctor Community Forum",
      description: "A platform for medical professionals to interact and share opinions on various topics in medical science."
    },
    {
      icon: <FileText size={28} className="text-teal-600" />,
      title: "Automated Report Generation",
      description: "Comprehensive reports for doctors and patients powered by Llama3.2 model for accurate diagnosis information."
    }
  ];

  const useCases = [
    {
      icon: <MapPin size={28} className="text-blue-500" />,
      title: "Rural Diagnostic Support",
      description: "Empower general practitioners with AI tools for complex diagnoses, reducing referrals and travel."
    },
    {
      icon: <BookOpen size={28} className="text-indigo-500" />,
      title: "Medical Training Platform",
      description: "Community forums facilitate knowledge sharing between senior and junior practitioners."
    },
    {
      icon: <Activity size={28} className="text-purple-500" />,
      title: "Emergency Response",
      description: "Prioritize critical cases by quickly identifying abnormalities and providing immediate suggestions."
    },
    {
      icon: <HeartPulse size={28} className="text-red-500" />,
      title: "Chronic Condition Detection",
      description: "Analyze patient history to detect early warning signs and enable timely interventions."
    },
    {
      icon: <Hospital size={28} className="text-green-500" />,
      title: "Hospital Integration",
      description: "Integrate AI diagnostic outputs directly into hospital management systems."
    },
    {
      icon: <ShieldCheck size={28} className="text-amber-500" />,
      title: "Compliance & Security",
      description: "HIPAA-compliant data handling with enterprise-grade security protocols."
    }
  ];

  const stats = [
    { value: "99.7%", label: "Detection Accuracy" },
    { value: "3.2s", label: "Average Analysis Time" },
    { value: "24/7", label: "Availability" },
    { value: "100+", label: "Supported Scan Types" }
  ];

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Cpu className="text-blue-600" size={24} />
            <span className="text-xl font-bold text-gray-800">MedVisor AI</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
            <a href="#usecases" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Use Cases</a>
            <a href="#technology" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Technology</a>
           
          </div>
          <a href="/dashboard">
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all">
            Login
          </button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="container mx-auto px-6 z-10">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="md:w-1/2 text-center md:text-left mb-12 md:mb-0"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Revolutionizing Medical Diagnostics with AI
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Advanced anomaly detection and collaborative tools for healthcare professionals
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center"
                >
                  Launch Application
                  <ArrowRight className="ml-2" size={20} />
                 
                </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-700 font-bold py-3 px-8 rounded-full shadow-lg"
                >
                  Learn More
                </motion.button>
               
              </div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500 rounded-2xl opacity-20 blur-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-lg rounded-xl p-2 shadow-2xl overflow-hidden">
                  <div className="w-full h-80 md:h-96 rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <img 
                      src="Images/mainpage.jpg" 
                      alt="Medical scan with AI analysis overlay" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 text-blue-900 py-1 px-3 rounded-full text-sm font-medium shadow-sm">
                      AI Analysis Active
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

     
      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Core Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Advanced AI Diagnostic Tools</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive suite of tools designed to enhance medical diagnostics and patient care
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Applications
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Transformative Healthcare Solutions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how our AI solution enhances healthcare delivery across various scenarios
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-blue-500"
              >
                <div className="mb-4 group-hover:-translate-y-1 transition-transform">
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{useCase.title}</h3>
                <p className="text-gray-600">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Showcase */}
      <section id="technology" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-400 rounded-2xl opacity-20 blur-lg"></div>
                <div className="relative bg-white rounded-xl shadow-xl overflow-hidden">
                  <img 
                    src="Images/page2.jpeg" 
                    
                    alt="AI analysis interface" 
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="flex items-center space-x-2">
                      <ClipboardCheck className="text-white" size={20} />
                      <span className="text-white font-medium">Real-time anomaly detection</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                Our Technology
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Cutting-Edge AI for Medical Imaging</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform combines multiple state-of-the-art AI models to provide the most accurate medical scan analysis available.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Cpu className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Multi-Model Architecture</h3>
                    <p className="text-gray-600">Combining VAE, Llama Vision, and transformer models for comprehensive analysis.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <ShieldCheck className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Secure Data Handling</h3>
                    <p className="text-gray-600">HIPAA-compliant with end-to-end encryption for all medical data.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Sparkles className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Continuous Learning</h3>
                    <p className="text-gray-600">Our models improve continuously with new data while preserving privacy.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}


      {/* CTA Section */}


      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Cpu className="text-blue-400" size={24} />
                <span className="text-xl font-bold">MedVisor AI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Advanced AI solutions for medical diagnostics and healthcare improvement.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">hello@medscanai.com</li>
                <li className="text-gray-400">+1 (555) 123-4567</li>
                <li className="text-gray-400">123 Medical Drive</li>
                <li className="text-gray-400">San Francisco, CA 94107</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} MedScanAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;