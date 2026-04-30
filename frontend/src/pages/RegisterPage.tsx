import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Activity, ArrowRight, ShieldCheck, Mail, Lock, User, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import loginBg from '../assets/images/login-bg.png';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'doctor',
    specialization: '',
    licenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'doctor' && !formData.specialization) {
      setError('Specialization is required for doctors');
      setLoading(false);
      return;
    }

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'doctor' && {
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        }),
      };

      const success = await register(registerData);
      if (success) {
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white relative">
      {/* Mobile Decorative Background Elements */}
      <div className="lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] aspect-square bg-primary-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] aspect-square bg-emerald-50/40 rounded-full blur-[100px]" />
      </div>

      {/* Left side: Premium Background & Branding */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-5/12 relative bg-primary-950 items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={loginBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-50 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/95 via-transparent to-primary-900/30" />
        </div>

        <div className="relative z-10 p-12 max-w-lg text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center mb-10"
          >
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <Activity className="h-8 w-8 text-emerald-400" />
            </div>
            <span className="ml-4 text-3xl font-black tracking-tighter">CaskAI</span>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Start Your <br />
              <span className="text-emerald-400">Recovery Journey</span>
            </h1>
            <p className="text-base text-gray-300 mb-8 leading-relaxed">
              Create an account and get access to real-time AI pose analysis to perfect your rehabilitation exercises.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <span className="text-sm font-medium">HIPAA Compliant Data Security</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Activity className="h-6 w-6 text-emerald-400" />
                <span className="text-sm font-medium">Real-time Form Feedback</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side: Register Form */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-7/12 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-white overflow-y-auto"
      >
        <div className="max-w-xl w-full mx-auto py-12">
          <div className="mb-8 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden flex items-center justify-center mb-6"
            >
              <Activity className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">CaskAI</span>
            </motion.div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create Account</h2>
            <p className="text-gray-500 font-medium">Join us to start your AI-powered rehabilitation</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center"
                >
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="name">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="email">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="role">Register as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'patient'})}
                    className={`py-3 px-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center ${
                      formData.role === 'patient' 
                      ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-sm' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <User className={`h-4 w-4 mr-2 ${formData.role === 'patient' ? 'text-primary-600' : ''}`} />
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'doctor'})}
                    className={`py-3 px-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center ${
                      formData.role === 'doctor' 
                      ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-sm' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Briefcase className={`h-4 w-4 mr-2 ${formData.role === 'doctor' ? 'text-primary-600' : ''}`} />
                    Doctor
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.role === 'doctor' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div className="md:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="specialization">Specialization</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Award className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        </div>
                        <input
                          id="specialization"
                          name="specialization"
                          type="text"
                          required
                          className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                          placeholder="Physiotherapist"
                          value={formData.specialization}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="licenseNumber">License No.</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        </div>
                        <input
                          id="licenseNumber"
                          name="licenseNumber"
                          type="text"
                          className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                          placeholder="MD123456"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="password">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-11 pr-12 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="confirmPassword">Confirm</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-11 pr-12 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="Repeat"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-6"
            >
              {loading ? <LoadingSpinner size="sm" /> : (
                <>
                  Create Account <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
