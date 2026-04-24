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
        className="w-full px-3 py-2 pr-10 border border-line bg-surface outline-none focus:border-accent text-sm"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-surface border border-line max-w-sm w-full shadow-xl"
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-accent" aria-hidden />
            <h3 className="text-[15px] font-medium text-ink">Change password</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-ink">Password changed successfully.</p>
              <button onClick={onClose} className="px-5 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3 py-2 bg-accent-soft border-l-2 border-accent text-accent text-[13px]">{error}</div>
              )}
              <div>
                <label className="label block mb-1.5">Current password</label>
                <PasswordInput required value={currentPassword} onChange={setCurrentPassword} />
              </div>
              <div>
                <label className="label block mb-1.5">New password</label>
                <PasswordInput required value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="label block mb-1.5">Confirm new password</label>
                <PasswordInput required value={confirmPassword} onChange={setConfirmPassword} />
              </div>
              <div className="flex gap-3 pt-2 border-t border-line -mx-5 px-5 pt-4">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 border border-line text-ink text-sm font-medium hover:bg-accent-soft/60 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 bg-ink text-canvas text-sm font-medium hover:bg-ink-2 transition-colors disabled:opacity-50">
                  {loading ? 'Saving…' : 'Change password'}
                </button>
              </div>
            </form>
          )}
        </div>
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
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-surface border-b border-line flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-accent" aria-hidden />
          <span className="text-ink font-medium text-[15px] tracking-tight">Customer Survey System</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-accent-soft transition-colors">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "hidden md:flex bg-surface border-r border-line transition-all duration-200 flex-col sticky top-0 h-screen",
        isSidebarOpen ? "w-60" : "w-16"
      )}>
        <div className="h-14 px-5 flex items-center justify-between border-b border-line">
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-4 bg-accent flex-shrink-0" aria-hidden />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink leading-tight truncate">Customer Survey</div>
                <div className="label" style={{ fontSize: '9.5px' }}>Admin Console</div>
              </div>
            </motion.div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 text-muted hover:text-ink hover:bg-accent-soft transition-colors flex-shrink-0">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={cn(
                "flex items-center px-3 py-2 text-[13px] transition-colors relative",
                active ? "bg-accent-soft text-ink font-medium" : "text-muted hover:text-ink hover:bg-accent-soft/60"
              )}>
                {active && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" aria-hidden />}
                <item.icon size={16} className={cn("flex-shrink-0", active ? "text-accent" : "text-muted")} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="ml-3">
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-2">
          {isSidebarOpen && user && (
            <div className="px-3 py-3 border-b border-line mb-2">
              <div className="label" style={{ fontSize: '9.5px' }}>Signed in as</div>
              <div className="mt-1 text-[13px] text-ink truncate font-medium">{user.full_name}</div>
              <div className="mt-0.5 label capitalize">{user.role}</div>
            </div>
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center w-full px-3 py-2 text-[13px] text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
          >
            <KeyRound size={15} className="flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3">Change password</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-[13px] text-muted hover:text-accent hover:bg-accent-soft transition-colors"
          >
            <LogOut size={15} className="flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3">Sign out</span>}
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
              className="fixed inset-y-0 left-0 w-72 bg-surface z-50 md:hidden flex flex-col border-r border-line"
            >
              <div className="h-14 px-5 flex items-center justify-between border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-accent" aria-hidden />
                  <span className="text-[15px] font-medium text-ink">Customer Survey</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted hover:bg-accent-soft"><X size={20} /></button>
              </div>
              <nav className="flex-1 p-2">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm relative",
                        active ? "bg-accent-soft text-ink font-medium" : "text-muted"
                      )}>
                      {active && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" aria-hidden />}
                      <item.icon size={18} className={cn("mr-3", active ? "text-accent" : "text-muted")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-2 border-t border-line">
                {user && (
                  <div className="px-4 py-3 border-b border-line mb-2">
                    <div className="label" style={{ fontSize: '9.5px' }}>Signed in as</div>
                    <div className="mt-1 text-sm text-ink truncate font-medium">{user.full_name}</div>
                    <div className="mt-0.5 label capitalize">{user.role}</div>
                  </div>
                )}
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowChangePassword(true); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-ink hover:bg-accent-soft/60"
                >
                  <KeyRound size={16} className="mr-3 text-muted" /> Change password
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm text-accent hover:bg-accent-soft">
                  <LogOut size={16} className="mr-3" /> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-14 bg-surface border-b border-line items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="label" style={{ fontSize: '9.5px' }}>Section</span>
            <span className="text-sm font-medium text-ink">{pageTitle}</span>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-3 hover:bg-accent-soft/60 px-3 py-1.5 transition-colors"
            >
              <div className="text-right">
                <div className="text-[13px] text-ink leading-tight font-medium">{user?.full_name || ''}</div>
                <div className="label capitalize" style={{ fontSize: '9.5px' }}>{user?.role || ''}</div>
              </div>
              <div className="w-8 h-8 bg-accent-soft flex items-center justify-center text-accent text-[11px] font-medium tabular border border-accent/25">
                {initials}
              </div>
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-1 w-52 bg-surface border border-line shadow-sm overflow-hidden z-50"
                >
                  <button
                    onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                    className="flex items-center w-full px-4 py-2.5 text-[13px] text-ink hover:bg-accent-soft/60 transition-colors"
                  >
                    <KeyRound size={14} className="mr-2.5 text-muted" /> Change password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-[13px] text-accent hover:bg-accent-soft transition-colors border-t border-line"
                  >
                    <LogOut size={14} className="mr-2.5" /> Sign out
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
      <nav className="md:hidden h-14 bg-surface border-t border-line flex items-center justify-around sticky bottom-0 z-40">
        {navItems.slice(0, 4).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
              active ? "text-accent" : "text-muted"
            )}>
              {active && <span className="absolute top-0 left-4 right-4 h-0.5 bg-accent" aria-hidden />}
              <item.icon size={18} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      </AnimatePresence>
    </div>
  );
}
