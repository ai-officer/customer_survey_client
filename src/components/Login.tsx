import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from '../lib/icons';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHero, AuthHeroMobile } from '@/components/ui/auth-hero';

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
      <AuthHero />

      {/* Right: auth form on cream canvas */}
      <section className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <AuthHeroMobile />

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
