import React, { useState } from 'react';
import { Sparkles, Mail, MapPin, Phone, ArrowLeft, Send, Loader2 } from 'lucide-react';

interface ContactUsProps {
  onNavigate: (path: string) => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert("Message sent! We'll get back to you shortly.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-600">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <img src="/Images/edumeet-logo2.png" alt="Edumeet Logo" className="h-9 w-auto" />
            <span className="font-bold text-xl tracking-tight text-slate-900">edu<span className="text-orange-500">meet</span></span>
          </div>
          <button onClick={() => onNavigate('/')} className="p-2 text-slate-500 hover:text-orange-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <div className="animate-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Touch</span></h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
              Have questions about our courses, enterprise solutions, or just want to say hello? We'd love to hear from you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-lg shadow-slate-200/50 border border-slate-100 shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Email Us</h3>
                  <p className="text-slate-500">support@edumeet.africa</p>
                  <p className="text-slate-500">partnerships@edumeet.africa</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-lg shadow-slate-200/50 border border-slate-100 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Visit Us</h3>
                  <p className="text-slate-500">12 Innovation Drive, Yaba</p>
                  <p className="text-slate-500">Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-right-8 duration-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">Full Name</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full font-semibold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-400" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
                <input required type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-full font-semibold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-400" placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">Message</label>
                <textarea required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-400 min-h-[160px] resize-none" placeholder="How can we help you?" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-4 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg shadow-orange-500/30 mt-2 active:scale-95 transition-all hover:shadow-orange-500/50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};