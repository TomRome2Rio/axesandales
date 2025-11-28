import React, { useState } from 'react';
import { login } from '../services/firebaseService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
        await login(email, password);
        setEmail('');
        setPassword('');
        onClose();
    } catch (err: any) {
        setError("Failed to login. Please check your email and password.");
        console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-sm border border-neutral-700">
        <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Member Login</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm text-neutral-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="w-full mt-2 px-8 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all hover:translate-y-px text-sm">Login</button>
        </form>
      </div>
    </div>
  );
};