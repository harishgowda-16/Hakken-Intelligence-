import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Chrome,
  FileText,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup';

const getAuthErrorMessage = (err: any) => {
  const code = String(err?.code || '');
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Email or password is incorrect.';
  if (code.includes('user-not-found')) return 'No account exists for that email.';
  if (code.includes('email-already-in-use')) return 'An account already exists for that email.';
  if (code.includes('weak-password')) return 'Use a password with at least 6 characters.';
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was closed before it finished.';
  return err?.message || 'Authentication failed. Please try again.';
};

export const LoginPage: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, navigate, redirectTo, user]);

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(trimmedEmail, password);
      } else {
        await signUpWithEmail(trimmedEmail, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 px-4 py-8 sm:px-6 lg:px-8 flex items-center">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
        <section className="space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 text-zinc-300 hover:text-white transition-colors">
            <span className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Hakken Intelligence</span>
          </Link>

          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Firebase Authentication + Firestore user database
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Sign in to your private document workspace
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Your uploaded document index is stored under your authenticated Firebase user, so library and search views only load your files.
            </p>
          </div>
        </section>

        <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950/80 border border-zinc-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submitAuth} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-300">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-zinc-300">Password</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="Minimum 6 characters"
                  className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </span>
            </label>

            {mode === 'signup' && (
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-zinc-300">Confirm password</span>
                <span className="relative block">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                </span>
              </label>
            )}

            {error && (
              <div className="flex gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-3 py-2.5 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="h-12 w-full rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-zinc-800" />
            <span>or</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={isSubmitting || loading}
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950/70 text-zinc-100 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Chrome className="h-4 w-4" />
            <span>Continue with Google</span>
          </button>
        </section>
      </div>
    </div>
  );
};
