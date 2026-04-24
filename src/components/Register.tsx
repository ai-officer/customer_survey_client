import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { full_name: fullName, email, password });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 bg-accent" aria-hidden />
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-ink leading-tight tracking-tight">
              Customer Survey
            </div>
            <div className="label" style={{ fontSize: '9.5px' }}>Admin Console</div>
          </div>
        </div>

        <div className="bg-surface border border-line p-8 max-w-sm w-full">
          <div className="mb-6">
            <div className="label" style={{ fontSize: '10px' }}>Create account</div>
            <h1 className="mt-2 text-xl font-medium text-ink tracking-tight">Register</h1>
            <p className="mt-1 text-sm text-muted">
              Submit your details to request access.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-2 border-negative text-negative px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Juan dela Cruz"
                className="w-full border border-line bg-surface focus:border-accent outline-none px-3 py-2 text-sm rounded-sm"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-line bg-surface focus:border-accent outline-none px-3 py-2 text-sm rounded-sm"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border border-line bg-surface focus:border-accent outline-none px-3 py-2 pr-10 text-sm rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="label mt-1.5">At least 8 characters</div>
            </div>

            <div>
              <label className="label block mb-1.5">Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full border border-line bg-surface focus:border-accent outline-none px-3 py-2 text-sm rounded-sm"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="bg-accent hover:bg-accent-2 text-white w-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting…' : 'Register'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="label">Already registered?</span>
          <Link to="/login" className="text-accent hover:text-accent-2 text-sm">
            Sign in
          </Link>
        </div>

        <p className="label text-center pt-2" style={{ fontSize: '9.5px' }}>
          Global Officium Limited Inc. · Customer Survey System
        </p>
      </div>

      {submitted && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-line max-w-sm w-full shadow-xl"
          >
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-accent" aria-hidden />
                <h3 className="text-[15px] font-medium text-ink">Registration submitted</h3>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="p-1 text-muted hover:text-ink hover:bg-accent-soft/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-accent-soft text-accent rounded-full flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">Awaiting admin approval</div>
                  <p className="mt-1.5 text-sm text-muted leading-relaxed">
                    Your registration request has been submitted. An administrator will review
                    and approve your account. You will be able to log in once approved.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-line -mx-5 px-5">
                <Link
                  to="/login"
                  className="block text-center w-full py-2.5 bg-ink hover:bg-ink-2 text-canvas text-sm font-medium transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
