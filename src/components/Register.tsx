import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, EyeOff, CheckCircle2 } from '../lib/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <Card className="p-8 text-center space-y-5">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="eyebrow">registration / submitted</div>
              <h2 className="heading text-[22px] font-semibold text-foreground mt-1">Request received</h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Your registration request has been submitted. An administrator will review and approve
              your account. You'll be able to sign in once it's approved.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to sign-in</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 py-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-foreground rounded-md relative">
            <ClipboardCheck size={22} className="text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary rounded-full" aria-hidden />
          </div>
          <div>
            <div className="eyebrow">authentication / register</div>
            <h1 className="heading text-[26px] font-semibold text-foreground mt-1 leading-tight">
              Request access
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              An administrator will review your request before it's activated.
            </p>
          </div>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-destructive rounded-md text-[13px]">
              <span className="eyebrow text-destructive opacity-90 mr-1">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Juan dela Cruz"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
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

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Submitting…' : 'Submit registration'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-[12px]">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-foreground font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>

        <p className="eyebrow text-center">
          global officium limited inc. · customer survey system
        </p>
      </div>
    </div>
  );
}
