import React, { useState } from 'react';
import { Sparkles, Users, Globe, Award, ArrowLeft, Menu, X } from 'lucide-react';

interface AboutUsProps {
  onNavigate: (path: string) => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-600">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
       )}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <img src="/Images/edumeet-logo2.png" alt="Edumeet Logo" className="h-9 w-auto" />
            <span className="font-bold text-xl tracking-tight text-slate-900">edu<span className="text-orange-500">meet</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => onNavigate('#/')} className="hover:text-orange-600 transition-colors">Home</button>
            <button onClick={() => onNavigate('#/about')} className="hover:text-orange-600 transition-colors">About Us</button>
            <button onClick={() => onNavigate('#/contact')} className="hover:text-orange-600 transition-colors">Contact Us</button>
            <button onClick={() => onNavigate('#/login')} className="hover:text-orange-600 transition-colors">Courses</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('#/login')} className="hidden md:block px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-500 transition-all">
                Sign In
            </button>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 md:hidden shadow-xl animate-in slide-in-from-top-5 duration-300 flex flex-col gap-4">
              <button onClick={() => onNavigate('#/')} className="text-left font-bold text-slate-600 hover:text-orange-600 py-2">Home</button>
              <button onClick={() => onNavigate('#/about')} className="text-left font-bold text-slate-600 hover:text-orange-600 py-2">About Us</button>
              <button onClick={() => onNavigate('#/contact')} className="text-left font-bold text-slate-600 hover:text-orange-600 py-2">Contact Us</button>
              <button onClick={() => onNavigate('#/login')} className="text-left font-bold text-slate-600 hover:text-orange-600 py-2">Courses</button>
              <button onClick={() => onNavigate('#/login')} className="w-full px-5 py-3 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-500 transition-all mt-2">
                  Sign In
              </button>
            </div>
        )}
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Empowering Africa's <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Future Leaders</span></h1>
          <p className="text-xl text-slate-500 leading-relaxed font-medium">
            Edumeet is more than a learning platform. We are a movement dedicated to bridging the gap between talent and opportunity through AI-driven education.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Globe, title: "Pan-African Vision", desc: "Built for the continent, connecting learners from Lagos to Nairobi with global-standard curriculums." },
            { icon: Users, title: "Community First", desc: "We believe in the power of peer learning. Our platform fosters collaboration and mentorship." },
            { icon: Award, title: "Excellence", desc: "Our courses are curated by industry experts and enhanced by our grounded AI assistant." }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-500">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
              To democratize access to high-quality education in technology, finance, and leadership, ensuring every African learner has the tools to succeed in the digital economy.
            </p>
            <div className="flex justify-center gap-4">
                <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            <Users size={16}/>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mt-4">Join 12,000+ Learners</p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 text-center">
        <p className="text-slate-400 text-sm font-medium">© 2024 Edumeet Inc. Built with ❤️ in Africa.</p>
      </footer>
    </div>
  );
};