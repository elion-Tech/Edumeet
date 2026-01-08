
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#0f172a]">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/95 backdrop-blur-3xl rounded-2xl shadow-2xl p-8 md:p-10 border border-white/20 min-h-[700px] flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40 mb-6 rotate-3 animate-float">
                <Sparkles size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              {view === 'forgot' ? 'Recover Access' : view === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              {view === 'forgot' ? 'Enter your email to receive a reset link.' : view === 'login' ? 'Access your personalized learning portal' : 'Join a community of modern scholars'}
            </p>
          </div>

          <form onSubmit={view === 'forgot' ? handleRequestReset : handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-rose-100 animate-in slide-in-from-top-4">
                  <AlertTriangle size={24} className="shrink-0" />
                  <span className="font-bold leading-relaxed">{error.message}</span>
              </div>
            )}

            {view === 'register' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+234..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@edumeet.com" className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">{view === 'register' ? 'Create Password' : 'Secure Password'}</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input type="password" required={view !== 'forgot'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700" />
                </div>
              </div>
            )}

            {view === 'register' && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center gap-2 ${role === UserRole.STUDENT ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-600/5' : 'border-slate-100 text-slate-400'}`}>
                  <GraduationCap size={24} /> <span className="text-[10px] font-black uppercase tracking-widest">Scholar</span>
                </button>
                <button type="button" onClick={() => setRole(UserRole.TUTOR)} className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center gap-2 ${role === UserRole.TUTOR ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-600/5' : 'border-slate-100 text-slate-400'}`}>
                  <Sparkles size={24} /> <span className="text-[10px] font-black uppercase tracking-widest">Instructor</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3.5 rounded-xl transition-all duration-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 mt-6 active:scale-95 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-sm font-black">{view === 'forgot' ? 'Send Reset Link' : view === 'login' ? 'Enter Portal' : 'Register Account'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </>
              )}
            </button>

            <div className="text-center">
              <button type="button" onClick={() => { setView(view === 'forgot' ? 'login' : view === 'login' ? 'register' : 'login'); setError(null); }} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all mt-6 uppercase tracking-[0.3em]">
                {view === 'forgot' ? "← Back to Login" : view === 'login' ? "New here? Create profile →" : "Already registered? Login"}
              </button>
              {view === 'login' && (
                <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="w-full text-center text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all mt-4 uppercase tracking-[0.3em]">
                  Forgot Password?
                </button>
              )}
            </div>
          </form>

          {view !== 'forgot' && <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase text-center mb-6 tracking-[0.4em]">One-Tap Simulation</p>
              <div className="grid grid-cols-3 gap-4">
                  {[
                    { role: UserRole.STUDENT, icon: <UserIcon size={18}/> },
                    { role: UserRole.TUTOR, icon: <Sparkles size={18}/> },
                    { role: UserRole.ADMIN, icon: <ShieldCheck size={18}/> }
                  ].map(demo => (
                    <button 
                      key={demo.role} 
                      disabled={loading}
                      onClick={() => startDemo(demo.role)} 
                      className="group flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-600 rounded-xl transition-all duration-500 border border-slate-100 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-90 disabled:opacity-50"
                    >
                      <div className="text-slate-400 group-hover:text-white transition-colors mb-3">
                        {loading ? <Loader2 size={18} className="animate-spin"/> : demo.icon}
                      </div>
                      <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest transition-colors">{demo.role}</span>
                    </button>
                  ))}
              </div>
          </div>}
        </div>
      </div>
    </div>
  );
};
