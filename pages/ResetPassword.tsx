import React, { useState, useEffect } from 'react';
import { Loader2, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // More robust token extraction from hash-based routing
        const href = window.location.href;
        const tokenMatch = href.match(/[?&]token=([^&#]+)/);
        const tokenParam = tokenMatch ? tokenMatch[1] : null;
        
        console.log("ResetPassword: Initializing with token:", tokenParam);
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            console.warn("ResetPassword: No token found in URL");
            setStatus('error');
            setMessage('Invalid or missing reset token.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setStatus('loading');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            console.log("ResetPassword: Submitting to", apiUrl, "with token", token);
            const response = await fetch(`${apiUrl}/api/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'Password updated successfully!');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('A connection error occurred. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="glass p-10 rounded-[32px] max-w-md w-full text-center space-y-6 shadow-2xl border-orange-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Success!</h2>
                    <p className="text-slate-500 font-medium">{message}</p>
                    <button 
                        onClick={() => window.location.hash = '#/login'} 
                        className="w-full bg-slate-900 text-white py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-black transition-all"
                    >
                        Go to Login <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="glass p-8 md:p-12 rounded-[32px] max-w-md w-full space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-600"></div>
                
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reset <span className="text-orange-600">Password</span></h2>
                    <p className="text-slate-500 mt-2 font-medium">Please enter your new secure password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
                            <input 
                                type="password" 
                                required 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 outline-none transition-all font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Confirm Password</label>
                        <input 
                            type="password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 outline-none transition-all font-bold"
                        />
                    </div>
                    <button 
                        disabled={status === 'loading' || !token}
                        className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-4 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};