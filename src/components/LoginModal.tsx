import React, { useState } from 'react';
import { login, register, signInWithGoogle, resetPassword } from '../services/firebaseService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setName('');
    setError(''); setSuccessMessage(''); setResetSent(false);
  };

  const switchTab = (newTab: AuthTab) => {
    resetForm();
    setTab(newTab);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      resetForm();
      onClose();
    } catch (err: any) {
      setError('Failed to login. Please check your email and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    try {
      await register(email, password, name.trim());
      setSuccessMessage('Account created! An admin will activate your membership once payment is confirmed.');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Registration failed. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) { setError('Please enter your email address first.'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError('No account found with that email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(''); setLoading(true);
    try {
      await signInWithGoogle();
      resetForm();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
      } else {
        setError(`Google sign-in failed: ${err.code || err.message || 'Unknown error'}`);
        console.error('Google sign-in error:', err.code, err.message, err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If registration was successful, show success screen
  if (successMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-sm border border-neutral-700">
          <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Welcome!</h2>
            <button onClick={() => { resetForm(); onClose(); }} className="text-neutral-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-900/50 border-2 border-green-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-green-400 font-medium">{successMessage}</p>
            <p className="text-neutral-400 text-sm">You can view the dashboard in the meantime, but booking will be available once your membership is confirmed.</p>
            <button onClick={() => { resetForm(); onClose(); }} className="w-full mt-2 px-8 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all text-sm">
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-sm border border-neutral-700">
        <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{tab === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="text-neutral-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'login' ? 'text-amber-400 border-b-2 border-amber-500 bg-neutral-750' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'register' ? 'text-amber-400 border-b-2 border-amber-500 bg-neutral-750' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            Register
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-medium shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {tab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-600"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-neutral-800 text-neutral-500">or use email</span></div>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              {resetSent && <p className="text-sm text-green-400">Password reset email sent! Check your inbox.</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end">
                <button type="button" onClick={handleResetPassword} disabled={loading} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Forgot your password?
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-2 px-8 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all hover:translate-y-px text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Display Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="How others will see you" className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="w-full mt-2 px-8 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all hover:translate-y-px text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};