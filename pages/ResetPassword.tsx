import React, { useState, useEffect } from 'react';
import { resetPassword } from '../services/authService';
import { Loader2, Key, ArrowRight } from 'lucide-react';

interface ResetPasswordProps {
  onNavigate: (path: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("No reset token found. Please request a new reset link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => onNavigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    }
    setLoading(false);
  };

  if (success) {
    return <div className="text-center p-10 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-emerald-600 mb-2">Password Reset Successfully!</h2>
        <p className="text-slate-600">Redirecting you to the login page...</p>
    </div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Set New Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
        <button type="submit" disabled={loading || !token} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};