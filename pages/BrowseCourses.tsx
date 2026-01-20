
import React, { useEffect, useState } from 'react';
import { Course, User } from '../types';
import { api } from '../services/apiService';
import { Search, ShoppingCart, Check, CreditCard, Loader2, Lock, Star, Sparkles, Video, Calendar, Clock, ExternalLink, Compass, ArrowRight, User as UserIcon, BookOpen, Eye } from 'lucide-react';

interface BrowseCoursesProps {
  user: User;
  onNavigate: (path: string) => void;
  onEnrollSuccess: (user: User) => void;
}

const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const TEST_PAYMENT_EMAIL = 'igweokwuekene@gmail.com';

export const BrowseCourses: React.FC<BrowseCoursesProps> = ({ user, onNavigate, onEnrollSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const res = await api.courses.getAll();
    if (res.data) setCourses(res.data.filter(c => c.published !== false));
    setLoading(false);
  };

  const handleEnrollLogic = async (courseId: string) => {
    const res = await api.users.enroll(user._id, courseId);
    if (res.status === 200 && res.data) {
        onEnrollSuccess(res.data);
        onNavigate(`#/course/${courseId}`);
    } else {
        alert(res.error || "Enrollment failed.");
    }
    setEnrollingId(null);
  };

  const handlePayAndEnroll = (course: Course) => {
      setEnrollingId(course._id);
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) { alert("Payment gateway failed to load."); setEnrollingId(null); return; }
      const handler = PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: TEST_PAYMENT_EMAIL,
          amount: Math.ceil(course.price * 100),
          currency: 'NGN',
          ref: 'EDM_' + Date.now(),
          callback: () => handleEnrollLogic(course._id),
          onClose: () => setEnrollingId(null)
      });
      handler.openIframe();
  };

  const handleEnrollClick = (course: Course) => {
      if ((user.enrolledCourseIds?.length ?? 0) >= 3) { alert("Enrollment Limit Reached (Max 3)."); return; }
      if (course.price > 0) handlePayAndEnroll(course);
      else { setEnrollingId(course._id); handleEnrollLogic(course._id); }
  };

  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2]?.length === 11) ? match[2] : null;
  };

  const filtered = (courses ?? []).filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLiveSessions = courses
    .filter(c => c.liveSession?.isActive && (user.enrolledCourseIds ?? []).includes(c._id))
    .map(c => ({ courseId: c._id, courseTitle: c.title, session: c.liveSession! }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 animate-in fade-in duration-1000">
      <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner ring-4 ring-orange-100">
        <Loader2 size={36} className="animate-spin text-orange-600" />
      </div>
      <p className="font-bold uppercase tracking-[0.2em] text-xs text-slate-400">Loading Courses...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-1000">
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center gap-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-0.5 w-12 bg-orange-600 rounded-full"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Explore</p>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-[1.1]">Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Perfect Course</span></h2>
          <p className="text-slate-500 font-medium mt-2 text-base">Expert-led courses designed to help you master new skills.</p>
        </div>
        <div className="relative w-full xl:w-[500px] group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
            <input 
                type="text"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200/80 rounded-full focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 outline-none transition-all shadow-sm font-bold text-slate-700 text-sm"
            />
        </div>
      </div>

      {activeLiveSessions.length > 0 && (
          <div className="bg-[#0f172a] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-[2000ms] scale-150"><Video size={160}/></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping"></div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400">Live Session In Progress</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeLiveSessions.map((ls, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl flex flex-col xxl:flex-row items-center gap-6 group/item hover:bg-white/10 transition-all duration-700">
                            <div className="flex-1 text-center xxl:text-left">
                                <h4 className="font-bold text-lg mb-2 group-hover/item:text-orange-400 transition-colors">{ls.session.topic}</h4>
                                <div className="flex items-center justify-center xxl:justify-start gap-6 text-[10px] font-bold uppercase tracking-widest text-orange-200/60">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl"><Calendar size={14} className="text-orange-400"/> {new Date(ls.session.date).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl"><Clock size={14} className="text-orange-400"/> {new Date(ls.session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                            <a href={ls.session.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-white text-[#0f172a] px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group/btn">
                                Join Live Class <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    ))}
                </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center glass rounded-[32px] border-dashed border-2 border-slate-200/50">
              <Compass size={48} className="mx-auto mb-6 text-slate-200 animate-pulse" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No courses found matching your search</p>
            </div>
          ) : (
            filtered.map(course => {
                const isEnrolled = (user.enrolledCourseIds ?? []).includes(course._id);
                const isProcessing = enrollingId === course._id;
                const ytId = course.modules?.[0]?.videoUrl ? getYoutubeId(course.modules[0].videoUrl) : null;
                let finalThumb = course.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800');

                return (
                <div key={course._id} className="group bg-white rounded-[32px] shadow-lg border border-slate-200/60 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full relative h-32 md:h-auto">
                    <div className="h-48 relative overflow-hidden bg-slate-900">
                        <img 
                            src={finalThumb} 
                            onError={(e) => {
                                const target = e.currentTarget;
                                const ytId = course.modules?.[0]?.videoUrl ? getYoutubeId(course.modules[0].videoUrl) : null;
                                const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                                const defaultFallback = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800';

                                if (!target.dataset.triedYoutube && ytThumb && finalThumb !== ytThumb) {
                                    target.src = ytThumb;
                                    target.dataset.triedYoutube = "true";
                                } else {
                                    target.src = defaultFallback;
                                }
                            }}
                            className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-2 transition-transform duration-[2000ms] opacity-90" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/50">
                            <span className="text-sm font-bold text-orange-600 tracking-tight">₦{course.price?.toLocaleString() ?? 0}</span>
                        </div>
                        {course.thumbnailUrl && (
                            <div className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500 to-rose-600 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg ring-2 ring-orange-600/10">
                                <Sparkles size={14} className="text-white" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Enhanced</span>

                            </div>
                        )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col relative">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm transition-transform duration-500 group-hover:rotate-12">
                              <UserIcon size={16} />

                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.tutorName}</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors duration-500">{course.title}</h3>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1 font-medium leading-relaxed">{course.description}</p>
                      
                      {isEnrolled ? (
                          <button onClick={() => onNavigate(`#/course/${course._id}`)} className="w-full bg-slate-900 text-white py-3 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg shadow-slate-950/20 uppercase text-[10px] tracking-widest active:scale-95 group/btn overflow-hidden relative">
                              <BookOpen size={16} className="group-hover/btn:scale-110 transition-transform"/> Continue Learning
                              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 blur-xl"></div>
                          </button>
                      ) : (
                          <div className="flex gap-3">
                              <button 
                                  onClick={() => onNavigate(`#/preview-course/${course._id}`)}
                                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-full font-bold hover:bg-slate-200 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest transition-all active:scale-95"
                              >
                                  <Eye size={16} /> Preview
                              </button>
                              <button 
                                  onClick={() => handleEnrollClick(course)}
                                  disabled={isProcessing}
                                  className="flex-[2] bg-gradient-to-r from-orange-500 to-rose-600 text-white py-3 rounded-full font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg uppercase text-[10px] tracking-widest transition-all active:scale-95 group/btn"
                              >
                                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                  {isProcessing ? 'Processing...' : 'Enroll'}
                              </button>
                          </div>
                      )}
                    </div>
                </div>
                );
            })
          )}
      </div>
    </div>
  );
};
