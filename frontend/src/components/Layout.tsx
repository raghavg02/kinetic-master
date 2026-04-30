import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, 
  User, 
  Activity, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Users,
  FileText
} from 'lucide-react';
import SidebarDoctorConnection from './SidebarDoctorConnection';
import DoctorConnectionRequests from './DoctorConnectionRequests';
import ChatWidget from './ChatWidget';
import NotificationCenter from './NotificationCenter';
import '../SereneWellness.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const chatWidgetRef = useRef<any>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsLarge(matches);
    };
    // Initial sync and listener
    handler(mq);
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler as (ev: Event) => void);
    } else if ('addListener' in mq) {
      // @ts-ignore for older browsers
      mq.addListener(handler);
    }
    return () => {
      if ('removeEventListener' in mq) {
        mq.removeEventListener('change', handler as (ev: Event) => void);
      } else if ('removeListener' in mq) {
        // @ts-ignore for older browsers
        mq.removeListener(handler);
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenChat = (relationshipId: string) => {
    if (chatWidgetRef.current) {
      chatWidgetRef.current.openChat(relationshipId);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const patientNavItems = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: Home },
    { path: '/patient/progress', label: 'Progress', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const doctorNavItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: Home },
    { path: '/doctor/patients', label: 'Patients', icon: Users },
    { path: '/doctor/reports', label: 'Reports', icon: FileText },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const navItems = user?.role === 'patient' ? patientNavItems : doctorNavItems;

  const isDoctorTheme = user?.role === 'doctor';

  return (
    <div className={`min-h-screen ${isDoctorTheme ? 'serene-wellness-container' : 'bg-gray-50'}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col ${isDoctorTheme ? 'bg-white/40 backdrop-blur-2xl' : 'bg-white'} shadow-xl`}>
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className={`text-2xl ${isDoctorTheme ? 'serene-title' : 'font-bold text-primary-600'}`}>Kinetic Master</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-bold rounded-2xl mb-2 transition-all ${
                    isActive(item.path)
                      ? isDoctorTheme ? 'bg-white/60 text-violet-700 shadow-sm' : 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-white/20 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Doctor Connection for Patients */}
            {user?.role === 'patient' && !isLarge && sidebarOpen && (
              <div className="mt-4">
                <SidebarDoctorConnection userId={user.id} />
              </div>
            )}

            {/* Connection Requests for Doctors */}
            {user?.role === 'doctor' && !isLarge && sidebarOpen && (
              <div className="mt-6 px-2">
                <DoctorConnectionRequests />
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex flex-col flex-grow ${isDoctorTheme ? 'bg-white/20 backdrop-blur-xl border-r border-white/20' : 'bg-white border-r border-gray-200'} pt-8 pb-4 overflow-y-auto`}>
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <h1 className={`text-2xl ${isDoctorTheme ? 'serene-title' : 'font-bold text-primary-600'}`}>Kinetic Master</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2 flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                    isActive(item.path)
                      ? isDoctorTheme ? 'bg-white/60 text-violet-700 shadow-sm' : 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-white/20 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Doctor Connection for Patients */}
            {user?.role === 'patient' && isLarge && (
              <div className="mt-4">
                <SidebarDoctorConnection userId={user.id} />
              </div>
            )}

            {/* Connection Requests for Doctors */}
            {user?.role === 'doctor' && isLarge && (
              <div className="mt-auto px-2 pt-10 pb-4">
                <DoctorConnectionRequests />
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className={`sticky top-0 z-10 flex-shrink-0 flex h-16 ${isDoctorTheme ? 'bg-white/10 backdrop-blur-md border-b border-white/10' : 'bg-white border-b border-gray-200'} lg:border-none`}>
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Activity className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent bg-transparent"
                    placeholder="Search clinical records..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <NotificationCenter onOpenChat={handleOpenChat} />

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center glass-card px-3 py-1.5">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-xl bg-violet-500 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                    <p className="text-[10px] text-violet-600 font-bold uppercase tracking-tighter">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="ml-4 p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all focus:outline-none"
                title="Logout"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
      {/* Floating chat widget mounted globally */}
      <ChatWidget ref={chatWidgetRef} />
    </div>
  );
};

export default Layout;
