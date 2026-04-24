import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BarChart3, LogOut, Menu, X, Users, Shield,
  Building2, KeyRound, Eye, EyeOff,
} from '../lib/icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LayoutProps {
  children: React.ReactNode;
}

function PasswordInput({
  value, onChange, placeholder, required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-lg p-6 max-w-sm w-full shadow-xl space-y-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow">account / security</div>
            <h3 className="heading text-[18px] font-semibold text-foreground mt-1 leading-none">
              Change password
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors -mr-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md flex items-center justify-center mx-auto">
              <KeyRound size={18} />
            </div>
            <p className="text-[14px] font-medium text-foreground">Password changed successfully.</p>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
                <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <PasswordInput required value={currentPassword} onChange={setCurrentPassword} />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <PasswordInput
                required
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <PasswordInput required value={confirmPassword} onChange={setConfirmPassword} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="relative inline-flex items-center justify-center h-7 w-7 bg-foreground rounded-md">
        <span className="font-mono text-[11px] font-semibold text-primary leading-none tracking-tight">CS</span>
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary rounded-full" aria-hidden />
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className="heading text-[14px] font-semibold text-foreground">Customer Survey</div>
          <div className="eyebrow leading-none mt-0.5">admin / console</div>
        </div>
      )}
    </Link>
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

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navSections = [
    {
      label: 'main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ClipboardList, label: 'Surveys', path: '/surveys' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      ],
    },
    ...(isAdmin ? [{
      label: 'admin',
      items: [
        { icon: Users, label: 'Users', path: '/settings/users' },
        { icon: Building2, label: 'Departments', path: '/settings/departments' },
        { icon: Shield, label: 'Audit Logs', path: '/settings/audit' },
      ],
    }] : []),
  ];
  const navItems = navSections.flatMap(s => s.items);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const pageTitle = navItems.find(item => location.pathname === item.path)?.label
    || navItems.find(item => location.pathname.startsWith(item.path) && item.path !== '/')?.label
    || 'System';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-40">
        <BrandMark />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-secondary rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        'hidden md:flex bg-card border-r border-border transition-all duration-200 flex-col sticky top-0 h-screen',
        isSidebarOpen ? 'w-60' : 'w-16',
      )}>
        <div className={cn(
          'flex items-center border-b border-border h-14',
          isSidebarOpen ? 'px-4 justify-between' : 'px-2 justify-center',
        )}>
          {isSidebarOpen ? <BrandMark /> : <BrandMark compact />}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              aria-label="Collapse sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mx-auto mt-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
            aria-label="Expand sidebar"
          >
            <Menu size={16} />
          </button>
        )}

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.label}
              className={cn(sectionIdx > 0 && 'mt-4 pt-3 border-t border-border')}
            >
              {isSidebarOpen && (
                <div className="eyebrow px-2 py-1.5">{section.label}</div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'relative flex items-center rounded-md transition-colors group text-[13.5px]',
                        isSidebarOpen ? 'px-2 py-2 gap-2.5' : 'p-2 justify-center',
                        active
                          ? 'bg-secondary text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      )}
                    >
                      {active && isSidebarOpen && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full" aria-hidden />
                      )}
                      <item.icon
                        size={16}
                        className={cn(
                          'shrink-0',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-border">
          {isSidebarOpen && user && (
            <div className="px-2 py-2 mb-1">
              <p className="text-[13px] font-medium text-foreground truncate">{user.full_name}</p>
              <p className="eyebrow mt-0.5">{user.role}</p>
            </div>
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className={cn(
              'flex items-center rounded-md transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground w-full text-[13px]',
              isSidebarOpen ? 'px-2 py-2 gap-2.5' : 'p-2 justify-center',
            )}
          >
            <KeyRound size={15} className="shrink-0" />
            {isSidebarOpen && <span>Change password</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center rounded-md transition-colors text-muted-foreground hover:bg-red-50 hover:text-destructive w-full text-[13px]',
              isSidebarOpen ? 'px-2 py-2 gap-2.5' : 'p-2 justify-center',
            )}
          >
            <LogOut size={15} className="shrink-0" />
            {isSidebarOpen && <span>Sign out</span>}
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
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 240 }}
              className="fixed inset-y-0 left-0 w-72 bg-card z-50 md:hidden shadow-2xl flex flex-col border-r border-border"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <BrandMark />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
                {navSections.map((section) => (
                  <div key={section.label}>
                    <div className="eyebrow px-2 pb-1.5">{section.label}</div>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] transition-colors',
                              active
                                ? 'bg-secondary text-foreground font-medium'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                            )}
                          >
                            <item.icon size={18} className={active ? 'text-primary' : ''} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="p-3 border-t border-border">
                {user && (
                  <div className="px-2 py-2">
                    <p className="text-[14px] font-medium text-foreground truncate">{user.full_name}</p>
                    <p className="eyebrow mt-0.5">{user.role}</p>
                  </div>
                )}
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowChangePassword(true); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-[14px] text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md transition-colors"
                >
                  <KeyRound size={16} /> Change password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-[14px] text-muted-foreground hover:bg-red-50 hover:text-destructive rounded-md transition-colors"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="hidden md:flex h-14 bg-card/80 backdrop-blur-sm border-b border-border items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="eyebrow">/</span>
            <h1 className="heading text-[15px] font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2.5 hover:bg-secondary rounded-md pl-2 pr-1 py-1 transition-colors"
            >
              <div className="text-right leading-tight">
                <p className="text-[13px] font-medium text-foreground">{user?.full_name || ''}</p>
                <p className="eyebrow">{user?.role || ''}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-foreground text-primary font-mono text-[11px] font-semibold flex items-center justify-center">
                {initials}
              </div>
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-popover rounded-md border border-border shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-foreground hover:bg-secondary transition-colors"
                  >
                    <KeyRound size={14} className="text-muted-foreground" /> Change password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-foreground hover:bg-red-50 hover:text-destructive transition-colors border-t border-border"
                  >
                    <LogOut size={14} className="text-muted-foreground" /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-14 bg-card border-t border-border flex items-center justify-around px-2 sticky bottom-0 z-40">
        {navItems.slice(0, 4).map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <item.icon size={18} className={active ? 'text-primary' : ''} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
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
