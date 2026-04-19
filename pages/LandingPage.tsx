import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Users, Play, Award, ChevronLeft, ChevronRight, Sparkles, Menu, X, BookOpen, PenTool, MessageSquare, Target, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const testimonials = [
    { name: "Amara Okafor", role: "Computer Science Student, Lagos", text: "The AI assistant clarified complex algorithms instantly. It's like having a study partner available 24/7 to answer my specific questions." },
    { name: "Kwame Mensah", role: "Business Analyst, Accra", text: "The finance modules combined with AI insights helped me understand global markets seamlessly." },
    { name: "Zainab Abdi", role: "Lifelong Learner, Nairobi", text: "The platform adapts to my pace. Finally, an education platform that feels truly personalized and intelligent." }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-600">
       {/* Mobile Overlay */}
       {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
       )}

       {/* Navbar Placeholder (Visual only) */}
       <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
             <div className="flex items-center gap-3">
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

          {/* Mobile Menu */}
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

       {/* Hero Section */}
       <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
             <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                   <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                   Live Classes + AI Assistant
                </div>
                
                <div className="relative">
                   <div className="absolute -inset-4 bg-white/40 backdrop-blur-xl rounded-[32px] -z-10 border border-white/50 shadow-xl shadow-slate-200/50"></div>
                   <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900">
                      Learn Better. <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Teach Smarter.</span>
                   </h1>
                </div>

                <p className="text-lg text-slate-600 leading-relaxed max-w-md font-medium">
                   Edumeet is a guided, AI-powered learning platform that transforms online education from passive content into structured, interactive, and outcome-driven learning.
                </p>

                <div className="flex items-center gap-4">
                   <button onClick={() => onNavigate('#/login')} className="px-8 py-4 bg-orange-600 text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">
                      Start Learning <ArrowRight size={18}/>
                   </button>
                   <button onClick={() => onNavigate('#/login')} className="px-8 py-4 bg-orange-600 text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">
                      Create a Course <ArrowRight size={18}/>
                   </button>
                </div>
             </div>

             <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/10 border-[8px] border-white rotate-2 hover:rotate-0 transition-transform duration-700">
                   <img src="/Images/landing-hero.jpg" alt="Students collaborating" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
                   
                   {/* Floating Badge */}
                   <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg flex items-center gap-4 animate-bounce duration-[3000ms]">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                               <Users size={14}/>
                            </div>
                         ))}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-900">12k+ Creators</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning now</p>
                      </div>
                   </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
             </div>
          </div>
       </section>

       {/* The Problem & Solution Section */}
       <section className="py-24 px-6 bg-white relative">
          <div className="max-w-7xl mx-auto">
             <div className="grid lg:grid-cols-2 gap-20 items-start">
                <div className="space-y-6">
                   <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500">The Problem</h2>
                   <h3 className="text-4xl font-black text-slate-900 leading-tight">
                      Online learning is everywhere—<br/>
                      <span className="text-slate-400">but real learning is not.</span>
                   </h3>
                   <div className="space-y-4 text-slate-600 font-medium">
                      <p>Most platforms focus on content, not outcomes. Learners struggle to stay consistent, ask questions, and complete courses.</p>
                      <p>For African tutors, limited tools and complex setups make it difficult to create structured, engaging knowledge sharing environments.</p>
                   </div>
                   <div className="pt-6 flex gap-8">
                      {['Low Completion', 'Low Engagement', 'Untapped Potential'].map((text, i) => (
                         <div key={i} className="flex flex-col gap-1">
                            <span className="text-xl font-black text-slate-900">{i === 2 ? '∞' : '↓'}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{text}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="glass p-10 md:p-12 rounded-[40px] border-orange-100 shadow-2xl shadow-orange-500/5 space-y-8">
                   <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">Our Solution</h2>
                   <h3 className="text-3xl font-black text-slate-900">Edumeet is built to fix this.</h3>
                   <p className="text-slate-600 font-medium">We combine AI tutoring, structured learning paths, and interactive content to create an experience that actually works.</p>
                   
                   <div className="grid gap-4">
                      {[
                         "Step-by-step guided learning",
                         "Real-time AI support while studying",
                         "Interactive quizzes, exams, and projects",
                         "Progress tracking and accountability"
                      ].map((item, i) => (
                         <div key={i} className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white shrink-0">
                               <CheckCircle2 size={14} />
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{item}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </section>

       {/* Personal AI Tutor Section */}
       <section className="py-24 px-6 bg-[#0f172a] text-white relative overflow-hidden rounded-[60px] mx-4">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500 rounded-full blur-[160px]"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
             <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange-400 border border-orange-500/30">
                   <Sparkles size={12}/> Your Personal AI Tutor
                </div>
                <h2 className="text-4xl md:text-5xl font-black">Learning shouldn’t feel <br/> <span className="text-orange-500">like guessing.</span></h2>
                <p className="text-slate-400 font-medium text-lg">Every learner gets an AI assistant tutor available every step of the way.</p>
             </div>

             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { title: "Answers Instantly", desc: "No more waiting for help. Get clarification the moment you feel stuck.", icon: MessageSquare },
                   { title: "Simplifies Concepts", desc: "Complex ideas broken down into digestible, easy-to-understand explanations.", icon: Zap },
                   { title: "Personalized Guidance", desc: "AI that understands your pace and adapts to your specific learning style.", icon: Target },
                   { title: "Interactive Learning", desc: "Supports voice and interactive dialogue for a true tutoring experience.", icon: Play }
                ].map((feature, i) => (
                   <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
                         <feature.icon size={22} />
                      </div>
                      <h4 className="font-bold text-xl mb-3">{feature.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.desc}</p>
                   </div>
                ))}
             </div>
          </div>
       </section>

       {/* For Learners & Educators Section */}
       <section className="py-24 px-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-sm border border-slate-100 space-y-8">
                   <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[24px] flex items-center justify-center mb-2">
                      <BookOpen size={32} />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900">For Learners</h3>
                   <p className="text-slate-600 font-medium">Stop jumping between courses. Get a guided, interactive experience that helps you build real-world skills and complete what you start.</p>
                   <ul className="space-y-4">
                      {['Stay Consistent', 'Understand Better', 'Complete What You Start'].map((li, i) => (
                         <li key={i} className="flex items-center gap-3 font-bold text-slate-900 text-sm">
                            <ShieldCheck className="text-green-500" size={18} /> {li}
                         </li>
                      ))}
                   </ul>
                   <button onClick={() => onNavigate('#/login')} className="w-full py-4 border-2 border-slate-900 text-slate-900 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all">Start Learning</button>
                </div>

                <div className="bg-slate-900 p-10 md:p-14 rounded-[48px] shadow-2xl text-white space-y-8">
                   <div className="w-16 h-16 bg-white/10 text-orange-500 rounded-[24px] flex items-center justify-center mb-2">
                      <PenTool size={32} />
                   </div>
                   <h3 className="text-3xl font-black">For Educators</h3>
                   <p className="text-slate-400 font-medium">Teach without barriers. Create and launch courses easily, structure content effectively, and scale your impact with AI-assisted tools.</p>
                   <ul className="space-y-4">
                      {['Easy Onboarding', 'AI-Assisted Creation', 'Scale Your Knowledge'].map((li, i) => (
                         <li key={i} className="flex items-center gap-3 font-bold text-white text-sm">
                            <ShieldCheck className="text-orange-500" size={18} /> {li}
                         </li>
                      ))}
                   </ul>
                   <button onClick={() => onNavigate('#/login')} className="w-full py-4 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20">Create a Course</button>
                </div>
             </div>
          </div>
       </section>

       {/* Stats Section */}
       <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
             <div className="grid md:grid-cols-3 gap-8">
                {[
                   { label: "Active Learners", value: "24,000+", icon: Users },
                   { label: "AI Assists", value: "1.2M+", icon: Sparkles },
                   { label: "Completion Rate", value: "94%", icon: Award }
                ].map((stat, i) => (
                   <div key={i} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                         <stat.icon size={24} />
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.value}</h3>
                      <p className="text-slate-500 font-medium">{stat.label}</p>
                   </div>
                ))}
             </div>
          </div>
       </section>

       {/* Impact Section */}
       <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
             <div className="text-center max-w-3xl mx-auto space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">Built for Africa, Designed for Impact</h2>
                <h3 className="text-4xl font-black text-slate-900 leading-tight">We are focused on solving real problems in the <span className="text-orange-600">African learning ecosystem.</span></h3>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">
                   Edumeet isn’t just another platform. It’s a system designed to improve outcomes, not just access. We empower local educators to teach at scale while making quality education accessible to everyone.
                </p>
                <div className="pt-8">
                   <button onClick={() => onNavigate('#/login')} className="px-10 py-5 bg-slate-900 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl">
                      Be part of the future of learning
                   </button>
                </div>
             </div>
          </div>
       </section>

       {/* Testimonials */}
       <section className="py-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-slate-900 mb-4">Student Success</h2>
                <p className="text-slate-500">Hear how AI-assisted learning is changing careers.</p>
             </div>

             <div className="relative max-w-4xl mx-auto">
                <div className="overflow-hidden">
                   <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
                      {testimonials.map((t, i) => (
                         <div key={i} className="w-full flex-shrink-0 px-4">
                            <div className={`p-10 rounded-[40px] transition-all duration-500 ${i === activeTestimonial ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-100' : 'bg-white text-slate-300 scale-95 opacity-50'}`}>
                               <div className="flex flex-col items-center text-center gap-6">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 p-1">
                                     <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                        {t.name.charAt(0)}
                                     </div>
                                  </div>
                                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">"{t.text}"</p>
                                  <div>
                                     <h4 className={`font-bold text-lg ${i === activeTestimonial ? 'text-orange-400' : 'text-slate-400'}`}>{t.name}</h4>
                                     <p className="text-sm font-bold uppercase tracking-widest opacity-60">{t.role}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                   <button onClick={() => setActiveTestimonial(Math.max(0, activeTestimonial - 1))} disabled={activeTestimonial === 0} className="p-3 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-all">
                      <ChevronLeft size={20}/>
                   </button>
                   <button onClick={() => setActiveTestimonial(Math.min(testimonials.length - 1, activeTestimonial + 1))} disabled={activeTestimonial === testimonials.length - 1} className="p-3 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-all">
                      <ChevronRight size={20}/>
                   </button>
                </div>
             </div>
          </div>
       </section>

       {/* Footer */}
       <footer className="bg-[#0f172a] text-white py-20 px-6 rounded-t-[48px]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
             <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                   <span className="font-bold text-xl tracking-tight text-white">edu<span className="text-orange-500">meet</span></span>
                   <img src="/Images/edumeet-logo2.png" alt="Edumeet Logo" className="h-9 w-auto" />
                </div>
                <p className="text-slate-400 max-w-sm leading-relaxed mb-8">
                   Edumeet exists to transform content into outcomes, helping people not just learn—but actually grow.
                </p>
                <div className="flex gap-4">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
                         <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div>
                <h4 className="font-bold text-lg mb-6">Platform</h4>
                <ul className="space-y-4 text-slate-400">
                   <li><button onClick={() => onNavigate('#/login')} className="hover:text-orange-400 transition-colors">Browse Courses</button></li>
                   <li><button onClick={() => onNavigate('#/about')} className="hover:text-orange-400 transition-colors">About Us</button></li>
                   <li><button onClick={() => onNavigate('#/contact')} className="hover:text-orange-400 transition-colors">Contact Us</button></li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-lg mb-6">Company</h4>
                <ul className="space-y-4 text-slate-400">
                   <li><button onClick={() => onNavigate('#/about')} className="hover:text-orange-400 transition-colors">About Us</button></li>
                   <li><button onClick={() => onNavigate('#/contact')} className="hover:text-orange-400 transition-colors">Contact</button></li>
                </ul>
             </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
             <p>© 2024 Edumeet Inc. All rights reserved.</p>
             <div className="flex gap-8">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             </div>
          </div>
       </footer>
    </div>
  );
};