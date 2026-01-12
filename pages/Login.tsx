
import React, { useState } from 'react';
import { login, signup, enterDemoMode, requestPasswordReset } from '../services/authService';
import { User, UserRole } from '../types';
import { Lock, Mail, AlertTriangle, User as UserIcon, GraduationCap, ArrowRight, Loader2, Phone, Key, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, code?: string} | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user: User;
      if (view === 'login') {
        user = await login(email, password);
      } else {
        user = await signup(name, email, password, phoneNumber, role);
      }
      onLogin(user);
    } catch (err: any) {
      setError({ message: err.message, code: err.code });
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        await requestPasswordReset(email);
        alert('If an account with that email exists, a password reset link has been sent.');
        setView('login');
        setEmail('');
    } catch (err: any) {
        setError({ message: err.message });
    }
    setLoading(false);
  };

  const startDemo = async (demoRole: UserRole) => {
      setLoading(true);
      try {
          const user = await enterDemoMode(demoRole);
          onLogin(user);
      } catch (err: any) {
          setError({ message: "Could not provision demo account. Server may be warming up." });
          setLoading(false);
      }
  };

  return (
   <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-[#f8fafc] font-sans selection:bg-orange-100 selection:text-orange-600">
      <div className="w-full max-w-[1400px] bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden flex min-h-[800px] relative ring-1 ring-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* Left Panel - Brand Visual */}
        <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-slate-900 via-[#0f172a] to-black relative flex-col justify-between p-16 text-white overflow-hidden">
            {/* Ambient Light */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse duration-[3000ms]"></div>
            
            <div className="relative z-10 animate-in slide-in-from-left-10 fade-in duration-700">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                        <Sparkles size={20} className="text-orange-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">edumeet</span>
                </div>
                
                <div className="space-y-6 max-w-lg">
                    <p className="text-orange-400 font-semibold uppercase tracking-widest text-xs">Educational Platform</p>
                    <h1 className="text-5xl font-bold leading-tight tracking-tight">
                        Master your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">potential.</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed font-medium">
                        Join a community of modern scholars. Experience the future of online learning with our premium platform.
                    </p>
                </div>
            </div>

            {/* Abstract Visual / Mockup */}
            <div className="relative z-10 mt-auto translate-y-12 translate-x-12">
                <div className="relative w-[380px] h-[600px] bg-slate-800 rounded-[48px] border-[8px] border-slate-700 shadow-2xl transform rotate-12 overflow-hidden animate-in slide-in-from-bottom-20 fade-in duration-1000 hover:rotate-6 hover:-translate-y-4 transition-all ease-out">
                    <img src="/images/login-hero.jpg" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" alt="App preview" />
                </div>
            </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-[45%] bg-white p-8 md:p-16 flex flex-col justify-center relative">
            <div className="max-w-md mx-auto w-full animate-in slide-in-from-right-8 fade-in duration-700">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">edumeet</span>
                </div>

                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                        {view === 'forgot' ? 'Recover Account' : view === 'login' ? 'Sign In' : 'Create Account'}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {view === 'forgot' ? 'Enter email to reset password' : view === 'login' ? 'Welcome back to Edumeet' : 'Start your learning journey'}
                    </p>
                </div>

                <form onSubmit={view === 'forgot' ? handleRequestReset : handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm border border-rose-100 animate-in slide-in-from-top-2">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <span className="font-medium">{error.message}</span>
                        </div>
                    )}

                    {view === 'register' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 ml-4 uppercase tracking-wide">Full Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 ml-4 uppercase tracking-wide">Phone</label>
                                <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+234..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400" />
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-4 uppercase tracking-wide">Email Address</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400" />
                    </div>

                    {view !== 'forgot' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 ml-4 uppercase tracking-wide">Password</label>
                            <input type="password" required={view !== 'forgot'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400" />
                        </div>
                    )}

                    {view === 'register' && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-2 ${role === UserRole.STUDENT ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                                <GraduationCap size={24} /> <span className="text-xs font-bold">Scholar</span>
                            </button>
                            <button type="button" onClick={() => setRole(UserRole.TUTOR)} className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-2 ${role === UserRole.TUTOR ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                                <Sparkles size={24} /> <span className="text-xs font-bold">Instructor</span>
                            </button>
                        </div>
                    )}

                    {view === 'login' && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white font-bold py-4 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : (view === 'forgot' ? 'Send Reset Link' : view === 'login' ? 'Sign In' : 'Create Account')}
                    </button>

                    <div className="text-center pt-6">
                        <button type="button" onClick={() => { setView(view === 'forgot' ? 'login' : view === 'login' ? 'register' : 'login'); setError(null); }} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                            {view === 'forgot' ? "Back to Login" : view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>

                {view !== 'forgot' && (
                    <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
                        <button 
                            disabled={loading}
                            onClick={() => startDemo(UserRole.ADMIN)} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin"/> : <ShieldCheck size={16}/>}
                            <span>Admin Demo</span>
                        </button>
                    </div>
                )}
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-300 font-medium">© 2024 Edumeet Inc. • Privacy • Terms</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};