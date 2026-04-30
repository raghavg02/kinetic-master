import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Activity, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import loginBg from '../assets/images/login-bg.png';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password');
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
        <div className="absolute top-[-10%] right-[-10%] w-[70%] aspect-square bg-primary-100/50 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[60%] aspect-square bg-emerald-50/50 rounded-full blur-[80px]" />
        <div className="absolute top-[20%] left-[-10%] w-[40%] aspect-square bg-blue-50/30 rounded-full blur-[60px]" />
      </div>

      {/* Left side: Premium Background & Branding */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-primary-950 items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={loginBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/90 via-transparent to-primary-900/40" />
        </div>

        <div className="relative z-10 p-12 max-w-lg text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center mb-12"
          >
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <Activity className="h-10 w-10 text-emerald-400" />
            </div>
            <span className="ml-4 text-4xl font-black tracking-tighter">Kinetic Master</span>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold leading-tight mb-6">
              AI-Powered <br />
              <span className="text-emerald-400">Rehabilitation</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Track your recovery journey with real-time pose analysis and personalized physiological guidance.
            </p>

            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-900 bg-gray-200" />
                ))}
              </div>
              <p className="text-sm text-gray-400 font-medium">
                Joined by <span className="text-white font-bold">2,000+</span> patients and doctors
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-primary-500/20 rounded-full blur-[120px]" />
      </motion.div>

      {/* Right side: Login Form */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 bg-white"
      >
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden flex items-center mb-8"
            >
              <Activity className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Kinetic Master</span>
            </motion.div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center"
              >
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3 animate-pulse" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
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
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-sm font-bold text-gray-700" htmlFor="password">Password</label>
                  <button type="button" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-11 pr-12 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center ml-1">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-primary-600 focus:ring-primary-600 border-gray-300 rounded-lg cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm font-bold text-gray-500 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? <LoadingSpinner size="sm" /> : (
                <>
                  Sign In <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-10 text-center text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>

          <div className="mt-12 flex items-center justify-center space-x-6 text-gray-400 grayscale opacity-50">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure HIPAA compliant</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
