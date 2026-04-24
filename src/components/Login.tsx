import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from '../lib/icons';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLockup } from '@/components/ui/brand-mark';

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
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: editorial hero on dark surface */}
      <aside className="sidebar-dark relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, oklch(0.78 0.13 175) 0%, transparent 50%),' +
              'radial-gradient(circle at 80% 70%, oklch(0.78 0.13 175) 0%, transparent 45%)',
          }}
          aria-hidden
        />
        <BrandLockup inverted size={40} />

        <div className="relative max-w-md">
          <div className="eyebrow mb-6">a customer survey platform</div>
          <blockquote className="font-display italic font-medium text-[40px] leading-[1.1] tracking-tight text-[color:var(--sidebar-fg)]">
            Measure what matters.
            <span className="block not-italic font-normal text-[color:var(--sidebar-muted-fg)] mt-3 text-[22px] leading-snug">
              Precise feedback, considered decisions, a record of voice across every engagement.
            </span>
          </blockquote>
        </div>

        <div className="relative flex items-end justify-between gap-6">
          <div className="eyebrow">
            © {new Date().getFullYear()} · Global Officium Ltd.
          </div>
          <div className="eyebrow">Manila · Philippines</div>
        </div>
      </aside>

      {/* Right: auth form on cream canvas */}
      <section className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <div className="md:hidden">
            <BrandLockup size={36} />
          </div>

          <div className="space-y-2">
            <div className="eyebrow">sign in</div>
            <h1 className="display text-[36px] text-foreground">Welcome back.</h1>
            <p className="text-[14px] text-muted-foreground">
              Enter your credentials to access the console.
            </p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
              <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-border">
            <span className="text-muted-foreground">No account yet?</span>
            <Link to="/register" className="font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
              Request access →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
