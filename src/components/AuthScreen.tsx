import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleOtpSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await signInWithOtp(email.trim());
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#1a1a1a] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202124] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex relative mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-amber-950 font-bold shadow-md">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#202124] flex items-center justify-center text-[10px] text-white font-bold">
              ✓
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Group Keep & Vault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Zero-knowledge encrypted notes & live group sync
          </p>
        </div>

        {/* Missing Supabase Config Notice */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Supabase credentials needed</span>
            </div>
            <p className="text-amber-700 dark:text-amber-300">
              Please configure your <code className="font-mono">.env</code> file with credentials from your Supabase dashboard:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
              <li>
                <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_PROJECT_ID</code> (from <strong>Project Settings &gt; General</strong>) or <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code>
              </li>
              <li>
                <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> (from <strong>Project Settings &gt; API Keys</strong>)
              </li>
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {otpSent ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Magic Link Sent!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              We sent a sign-in link to <strong>{email}</strong>. Check your inbox and click the link to log in.
            </p>
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="text-xs text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || !isSupabaseConfigured}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#303134] hover:bg-gray-50 dark:hover:bg-[#3c4043] text-gray-700 dark:text-gray-200 font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
              <span className="text-xs uppercase tracking-wider text-gray-400">or with email</span>
              <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
            </div>

            {/* Magic Link Email Form */}
            <form onSubmit={handleOtpSignIn} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={!isSupabaseConfigured}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
              >
                <span>{loading ? 'Sending link...' : 'Send Magic Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Security Highlights */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Zero-Knowledge</p>
              <p className="text-[10px] text-gray-500">AES-256-GCM client encrypted</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">PostgreSQL RLS</p>
              <p className="text-[10px] text-gray-500">Private row-level security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

