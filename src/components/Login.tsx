import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-surface border border-line p-8 shadow-sm rise">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-5 bg-accent" aria-hidden />
            <span className="text-ink font-medium text-lg tracking-tight">Customer Survey System</span>
          </div>

          <div className="mb-6">
            <div className="label" style={{ fontSize: '9.5px' }}>Authentication</div>
            <h1 className="mt-1 text-[15px] font-medium text-ink">Sign in to your account</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-2 border-negative text-negative px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-2 text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="label text-center">
          Global Officium Limited Inc. — Customer Survey System
        </p>
      </div>
    </div>
  );
}
