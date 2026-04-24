import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from '../lib/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLockup } from '@/components/ui/brand-mark';

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
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
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
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: hero on dark surface */}
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
          <div className="eyebrow mb-6">request access</div>
          <blockquote className="font-display italic font-medium text-[40px] leading-[1.1] tracking-tight text-[color:var(--sidebar-fg)]">
            A careful voice, amplified.
            <span className="block not-italic font-normal text-[color:var(--sidebar-muted-fg)] mt-3 text-[22px] leading-snug">
              Accounts are reviewed by an administrator. Once approved, you'll receive a confirmation email with sign-in details.
            </span>
          </blockquote>
        </div>

        <div className="relative flex items-end justify-between gap-6">
          <div className="eyebrow">© {new Date().getFullYear()} · Global Officium Ltd.</div>
          <div className="eyebrow">Manila · Philippines</div>
        </div>
      </aside>

      {/* Right: form */}
      <section className="flex items-center justify-center p-6 md:p-12 bg-background">
        {submitted ? (
          <div className="w-full max-w-sm space-y-6 text-center py-8">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-2">
              <div className="eyebrow">registration · submitted</div>
              <h1 className="display text-[30px] text-foreground">Request received.</h1>
              <p className="text-[14px] text-muted-foreground">
                An administrator will review and approve your account. You'll be able to sign in once approved.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">← Back to sign-in</Link>
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-7 py-6">
            <div className="md:hidden"><BrandLockup size={36} /></div>

            <div className="space-y-2">
              <div className="eyebrow">request access</div>
              <h1 className="display text-[36px] text-foreground">Create an account.</h1>
              <p className="text-[14px] text-muted-foreground">
                An administrator will review your request before it's activated.
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
                <Label htmlFor="name">Full name</Label>
                <Input id="name" type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
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
                    placeholder="Minimum 8 characters"
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                />
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full mt-2">
                {loading ? 'Submitting…' : 'Submit registration'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-border">
              <span className="text-muted-foreground">Already have an account?</span>
              <Link to="/login" className="font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                Sign in →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
