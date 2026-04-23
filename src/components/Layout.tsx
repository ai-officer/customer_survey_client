import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart3, Settings, LogOut, Menu, X, Users, Shield, Building2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

function PasswordInput({ value, onChange, placeholder, required }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><KeyRound size={18} /></div>
            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <KeyRound size={24} />
            </div>
            <p className="font-semibold text-gray-900">Password changed successfully!</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <PasswordInput required value={currentPassword} onChange={setCurrentPassword} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <PasswordInput required value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <PasswordInput required value={confirmPassword} onChange={setConfirmPassword} />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all text-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm disabled:opacity-50">
                {loading ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ClipboardList, label: 'Surveys', path: '/surveys' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ...(isAdmin ? [
      { icon: Users, label: 'Users', path: '/settings/users' },
      { icon: Building2, label: 'Departments', path: '/settings/departments' },
      { icon: Shield, label: 'Audit Logs', path: '/settings/audit' },
    ] : []),
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const pageTitle = navItems.find(item => location.pathname === item.path)?.label
    || navItems.find(item => location.pathname.startsWith(item.path) && item.path !== '/')?.label
    || 'System';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <span className="font-bold text-lg text-indigo-600">CSS Admin</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "hidden md:flex bg-white border-r border-gray-200 transition-all duration-300 flex-col sticky top-0 h-screen",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl text-indigo-600">
              CSS Admin
            </motion.span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn(
              "flex items-center p-3 rounded-xl transition-all group",
              location.pathname === item.path
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <item.icon size={22} className={cn(
                "transition-transform group-hover:scale-110 flex-shrink-0",
                location.pathname === item.path ? "text-indigo-600" : "text-gray-400"
              )} />
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-3 font-medium">
                  {item.label}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          {isSidebarOpen && user && (
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center w-full p-3 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
          >
            <KeyRound size={22} className="flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium">Change Password</span>}
          </button>
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group">
            <LogOut size={22} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <span className="font-bold text-xl text-indigo-600">CSS Admin</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center p-4 rounded-2xl transition-all",
                      location.pathname === item.path ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
                    )}>
                    <item.icon size={24} className="mr-4" />
                    <span className="font-semibold text-lg">{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-6 border-t border-gray-100 space-y-3">
                {user && (
                  <div className="px-1">
                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                  </div>
                )}
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowChangePassword(true); }}
                  className="flex items-center w-full p-4 text-indigo-600 bg-indigo-50 rounded-2xl font-bold"
                >
                  <KeyRound size={24} className="mr-4" /> Change Password
                </button>
                <button onClick={handleLogout} className="flex items-center w-full p-4 text-red-600 bg-red-50 rounded-2xl font-bold">
                  <LogOut size={24} className="mr-4" /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl px-3 py-2 transition-all"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || ''}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || ''}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {initials}
              </div>
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <KeyRound size={16} className="mr-2" /> Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <LogOut size={16} className="mr-2" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 sticky bottom-0 z-40">
        {navItems.slice(0, 4).map((item) => (
          <Link key={item.path} to={item.path} className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
            location.pathname === item.path ? "text-indigo-600" : "text-gray-400"
          )}>
            <item.icon size={20} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      </AnimatePresence>
    </div>
  );
}
