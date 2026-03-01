import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { Icons } from './Icons';
import { hasPermission } from '../utils/permissions';

export default function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: Icons.dashboard, permission: '' },
    { path: '/patients', label: 'Patients', icon: Icons.patients, permission: 'view_patients' },
    { path: '/appointments', label: 'Appointments', icon: Icons.calendar, permission: 'view_appointments' },
    { path: '/invoices', label: 'Invoices', icon: Icons.invoice, permission: 'view_invoices' },
    { path: '/lab-results', label: 'Lab Results', icon: Icons.flask, permission: 'view_lab_results' },
    { path: '/tasks', label: 'Tasks', icon: Icons.task, permission: 'view_tasks' },
  ];
  const navItems = allNavItems.filter(item => !item.permission || hasPermission(user, item.permission as any));

  const allSettingsItems = [
    { path: '/presets', label: 'Quick Presets', icon: Icons.zap, permission: 'view_presets' },
    { path: '/tags', label: 'Patient Tags', icon: Icons.tag, permission: 'view_tags' },
    { path: '/custom-fields', label: 'Custom Fields', icon: Icons.fileText, permission: 'view_custom_fields' },
    { path: '/note-templates', label: 'Note Templates', icon: Icons.file, permission: 'view_note_templates' },
    { path: '/users', label: 'Staff', icon: Icons.users, permission: 'view_users' },
    { path: '/email-settings', label: 'Email Settings', icon: Icons.mail, permission: 'view_settings' },
  ];
  const settingsItems = allSettingsItems.filter(item => hasPermission(user, item.permission as any));

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 shadow-lg shadow-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-8">
              <h1 
                onClick={() => navigate('/')} 
                className="text-xl sm:text-2xl font-bold text-white cursor-pointer hover:text-blue-100 transition-all"
              >
                Medora
              </h1>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white shadow-md'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon({})}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Right Side - Settings & Logout */}
            <div className="hidden md:flex items-center gap-1">
              <div className="relative group">
                <button className="p-2 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200">
                  {Icons.settings({ size: 20 })}
                </button>
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden group-hover:block z-50">
                  {settingsItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.icon({})}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                {Icons.logout({ size: 18 })}
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-800 border-t border-blue-600 mobile-menu">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center gap-3 ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon({})}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="border-t border-blue-600 my-2 pt-2">
                <p className="px-4 py-1 text-xs font-medium text-blue-300 uppercase">Settings</p>
              </div>
              {settingsItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left font-medium transition-colors flex items-center gap-3 ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon({})}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center gap-3 text-red-200 hover:bg-red-500/20 hover:text-red-100"
              >
                {Icons.logout({ size: 20 })}
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
