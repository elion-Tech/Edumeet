import React, { useEffect, useState } from 'react';
import { Course, User, UserRole, Progress, LiveSession } from '../types';
import { api } from '../services/apiService';
import { Edit, Users, Award, CheckCircle, Video, Calendar, Loader2, Trash2, X, Phone, Mail, User as UserIcon, ShieldCheck, Megaphone, Send, PlusCircle, Clock, ExternalLink, ToggleRight, ToggleLeft, ArrowLeft, BookOpen } from 'lucide-react';

interface CourseDetailsViewProps {
  user: User;
  courseId: string;
  onNavigate: (path: string) => void;
}

export const CourseDetailsView: React.FC<CourseDetailsViewProps> = ({ user, courseId, onNavigate }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<{user: User, progress: Progress | null}[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [gradingModal, setGradingModal] = useState<{progressId: string, userId: string, studentName: string, submission: string, courseTitle: string} | null>(null);
  const [liveSessionModal, setLiveSessionModal] = useState<{course: Course, session?: LiveSession} | null>(null); // Combined for new/edit
  const [broadcastModal, setBroadcastModal] = useState<{courseId: string, courseTitle: string} | null>(null);
  
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [lsTopic, setLsTopic] = useState('');
  const [lsDate, setLsDate] = useState('');
  const [lsMeetingLink, setLsMeetingLink] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const isTutorOrAdmin = user.role === UserRole.TUTOR || user.role === UserRole.ADMIN;

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const courseRes = await api.courses.getById(courseId);
      if (courseRes.data) {
        setCourse(courseRes.data);
        fetchStudents(courseId);
        fetchLiveSessions(courseId);
      } else {
        alert("Course not found!");
        onNavigate(user.role === UserRole.ADMIN ? '#/admin' : '#/');
      }
    } catch (error) {
      console.error("Failed to load course details:", error);
      alert("Failed to load course details.");
      onNavigate(user.role === UserRole.ADMIN ? '#/admin' : '#/');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (cId: string) => {
      const res = await api.courses.getEnrolledStudents(cId);
      setEnrolledStudents(res.data?.filter(Boolean) ?? []);
  };

  const fetchLiveSessions = async (cId: string) => {
      const res = await api.courses.getLiveSessionsByCourse(cId);
      setLiveSessions(res.data?.filter(Boolean) ?? []);
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!confirm(`Permanently delete course "${course.title}" and all associated data? This action cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await api.courses.delete(course._id);
      alert("Course deleted successfully.");
      onNavigate(user.role === UserRole.ADMIN ? '#/admin' : '#/');
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course.");
    } finally {
      setActionLoading(false);
    }
  };

  const submitGrade = async () => {
      if (!gradingModal || !course) return;
      setActionLoading(true);
      try {
        await api.progress.gradeCapstone(gradingModal.progressId, gradeScore, gradeFeedback);
        await api.notifications.send({
            userId: gradingModal.userId,
            fromName: user.name,
            message: `Your project for "${gradingModal.courseTitle}" has been graded: ${gradeScore}%`,
            type: 'grade'
        });
        setGradingModal(null);
        fetchStudents(course._id); // Refresh student data
        alert("Capstone graded and student notified.");
      } catch (error) {
        console.error("Failed to submit grade:", error);
        alert("Failed to submit grade.");
      } finally {
        setActionLoading(false);
      }
  };

  const handleScheduleLive = async () => {
      if (!liveSessionModal?.course || !lsTopic || !lsDate || !lsMeetingLink) return;
      
      if (new Date(lsDate) < new Date()) {
          alert("Cannot schedule a meeting in the past.");
          return;
      }

      setActionLoading(true);
      const sessionData = {
          _id: liveSessionModal.session?._id, // Pass _id if updating
          topic: lsTopic,
          date: lsDate,
          meetingLink: lsMeetingLink,
          isActive: liveSessionModal.session?.isActive ?? true // Keep existing status or default to active
      };
      try {
        const res = await api.courses.scheduleLive(liveSessionModal.course._id, sessionData);
        if (res.error) {
            alert(res.error);
        } else {
            alert("Live class scheduled/updated and students have been notified.");
            setLiveSessionModal(null);
            setLsTopic('');
            setLsDate('');
            setLsMeetingLink('');
            fetchLiveSessions(liveSessionModal.course._id); // Refresh live sessions
        }
      } catch (error) {
        console.error("Failed to schedule live session:", error);
        alert("Failed to schedule live session.");
      } finally {
        setActionLoading(false);
      }
  };

  const handleToggleLiveSession = async (liveSessionId: string, currentStatus: boolean) => {
    if (!course) return;
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this live session?`)) return;

    setActionLoading(true);
    const sessionToToggle = liveSessions.find(ls => ls._id === liveSessionId);
    if (!sessionToToggle) {
        alert("Session not found.");
        setActionLoading(false);
        return;
    }

    const sessionData = {
        _id: liveSessionId,
        topic: sessionToToggle.topic,
        date: sessionToToggle.date,
        meetingLink: sessionToToggle.meetingLink,
        isActive: !currentStatus // Toggle status
    };
    try {
      const res = await api.courses.scheduleLive(course._id, sessionData);
      if (res.error) {
          alert(res.error);
      } else {
          alert(`Live session ${action}d.`);
          fetchLiveSessions(course._id); // Refresh live sessions
      }
    } catch (error) {
      console.error("Failed to toggle live session status:", error);
      alert("Failed to toggle live session status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLiveSession = async (liveSessionId: string) => {
      if (!course) return;
      if (!confirm('Are you sure you want to permanently delete this live session? This action cannot be undone.')) return;
      setActionLoading(true);
      try {
        const res = await api.courses.deleteLiveSession(course._id, liveSessionId);
        if (res.error) {
            alert(res.error);
        } else {
            alert("Live session deleted successfully.");
            fetchLiveSessions(course._id); // Refresh live sessions
        }
      } catch (error) {
        console.error("Failed to delete live session:", error);
        alert("Failed to delete live session.");
      } finally {
        setActionLoading(false);
      }
  };

  const openLiveSessionModalForEdit = (session: LiveSession) => {
    if (!course) return;
    const dateObj = session.date ? new Date(session.date) : null;
    const formattedDate = (dateObj && !isNaN(dateObj.getTime())) 
      ? new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';

    setLsTopic(session.topic || '');
    setLsDate(formattedDate);
    setLsMeetingLink(session.meetingLink || '');
    setLiveSessionModal({ course, session });
  }

  const handleBroadcast = async () => {
      if (!broadcastModal || !broadcastMessage.trim()) return;
      setActionLoading(true);
      try {
        const res = await api.courses.getEnrolledStudents(broadcastModal.courseId);
        const students = res.data ?? [];
        const promises = students.map(s => api.notifications.send({
            userId: s.user._id,
            fromName: user.name,
            message: `[Broadcast] ${broadcastModal.courseTitle}: ${broadcastMessage}`,
            type: 'announcement'
        }));
        await Promise.all(promises);
        alert(`Broadcast sent to ${students.length} students.`);
        setBroadcastModal(null);
        setBroadcastMessage('');
      } catch (error) {
        console.error("Failed to send broadcast:", error);
        alert("Failed to send broadcast.");
      } finally {
        setActionLoading(false);
      }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-orange-600" size={32} />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading Course Details...</p>
    </div>
  );

  if (!course) return null; // Should not happen if loading is handled correctly

  const ytId = course.modules?.[0]?.videoUrl ? getYoutubeId(course.modules[0].videoUrl) : null;
  let finalThumb = course.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-200">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate(user.role === UserRole.ADMIN ? '#/admin' : '#/')} className="p-2.5 bg-slate-100 hover:bg-orange-600 hover:text-white rounded-full transition-all duration-500 active:scale-90 shadow-sm border border-slate-100">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Course Details</p>
                <h2 className="text-xl font-black text-slate-900">{course.title}</h2>
            </div>
        </div>
        {isTutorOrAdmin && (
            <div className="flex gap-3">
                <button onClick={() => onNavigate(`#/edit-course/${course._id}`)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                    <Edit size={18} /> Edit Course
                </button>
                <button onClick={handleDeleteCourse} disabled={actionLoading} className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                    {actionLoading ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={18} />} Delete Course
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
                <div className="h-48 relative overflow-hidden bg-slate-900 rounded-2xl">
                    <img 
                        src={finalThumb} 
                        alt={course.title}
                        className="w-full h-full object-cover opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/50">
                        <span className="text-sm font-bold text-orange-600 tracking-tight">₦{course.price?.toLocaleString() ?? 0}</span>
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{course.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{course.description}</p>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <UserIcon size={16} className="text-orange-600"/>
                    <span>Tutor: {course.tutorName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <BookOpen size={16} className="text-orange-600"/>
                    <span>{course.modules.length} Modules</span>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {isTutorOrAdmin && (
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Megaphone size={20} className="text-orange-600"/> Actions</h3>
                    <button onClick={() => setBroadcastModal({courseId: course._id, courseTitle: course.title})} className="w-full py-3 bg-orange-50 border border-orange-100 rounded-xl text-orange-600 text-sm font-bold uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center justify-center gap-2">
                        <Send size={18} /> Send Broadcast
                    </button>
                    <button onClick={() => setLiveSessionModal({ course })} className="w-full py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                        <PlusCircle size={18} /> Schedule New Live Session
                    </button>
                </div>
            )}
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Video size={20} className="text-rose-600"/> Live Sessions ({liveSessions.length})</h3>
                {liveSessions.length === 0 ? (
                    <p className="text-slate-500 text-sm">No live sessions scheduled for this course.</p>
                ) : (
                    <div className="space-y-4">
                        {liveSessions.map(ls => (
                            <div key={ls._id} className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-bold leading-relaxed">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Video size={14} className="text-rose-600" />
                                        <span>{ls.topic}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${ls.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {ls.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 font-medium mt-2">
                                    <Calendar size={12} /> {new Date(ls.date).toLocaleDateString()}
                                    <Clock size={12} className="ml-3" /> {new Date(ls.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <a href={ls.meetingLink} target="_blank" rel="noopener noreferrer" className="ml-auto text-rose-600 hover:underline flex items-center gap-1">
                                        Join <ExternalLink size={12} />
                                    </a>
                                </div>
                                {isTutorOrAdmin && (
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button onClick={() => openLiveSessionModalForEdit(ls)} className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase hover:bg-rose-200 transition-colors">Edit</button>
                                        <button onClick={() => handleToggleLiveSession(ls._id, ls.isActive)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${ls.isActive ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                                            {ls.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {ls.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => handleDeleteLiveSession(ls._id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase hover:bg-red-200 transition-colors">Delete</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Users size={16} className="text-orange-600" /> Enrolled Students ({enrolledStudents.length})</h3>
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr><th className="px-6 py-4">Student Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Capstone Submission</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(enrolledStudents ?? []).length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No students enrolled yet</td></tr>
                    ) : (
                        enrolledStudents.map((item, idx) => (
                            <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm text-slate-900 leading-none mb-1">{item.user.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${item.progress?.capstoneStatus === 'submitted' ? 'bg-amber-50 text-amber-600 border-amber-200' : item.progress?.capstoneStatus === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {item.progress?.capstoneStatus || 'Pending Enrollment'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {item.progress?.capstoneSubmissionText ? (
                                        <span className="text-slate-600 text-xs line-clamp-2">{item.progress.capstoneSubmissionText}</span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.progress?.capstoneStatus === 'submitted' && isTutorOrAdmin && (
                                        <button 
                                          onClick={() => setGradingModal({
                                            progressId: item.progress!._id, 
                                            userId: item.user._id, 
                                            studentName: item.user.name, 
                                            submission: item.progress!.capstoneSubmissionText || '', 
                                            courseTitle: course.title
                                          })} 
                                          className="bg-orange-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md shadow-orange-100"
                                        >
                                          Review Submission
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Grading</p>
                        <h3 className="text-xl font-bold text-slate-900">Grade Capstone for {gradingModal.courseTitle}</h3>
                    </div>
                    <button onClick={() => setGradingModal(null)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project Submission</p>
                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{gradingModal.submission}</p>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Score (0-100)</label>
                        <input type="number" min="0" max="100" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" value={gradeScore} onChange={e => setGradeScore(Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Feedback</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all resize-none h-24" placeholder="Enter constructive feedback..." value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} />
                    </div>

                    <button onClick={submitGrade} disabled={actionLoading} className="w-full py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest mt-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95">
                        {actionLoading ? <Loader2 className="animate-spin"/> : <Award size={18}/>} Submit Grade
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Live Session Modal */}
      {liveSessionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Live Class</p>
                        <h3 className="text-xl font-bold text-slate-900">{liveSessionModal.course.title}</h3>
                    </div>
                    <button onClick={() => setLiveSessionModal(null)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Session Topic</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" placeholder="e.g. Module 1 Deep Dive" value={lsTopic} onChange={e => setLsTopic(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Date & Time</label>
                        <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" value={lsDate} onChange={e => setLsDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Meeting URL</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" placeholder="https://meet.google.com/..." value={lsMeetingLink} onChange={e => setLsMeetingLink(e.target.value)} />
                    </div>
                    <button onClick={handleScheduleLive} disabled={actionLoading} className="w-full py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest mt-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95">
                        {actionLoading ? <Loader2 className="animate-spin"/> : <Video size={18}/>} {liveSessionModal.session ? 'Update Session' : 'Schedule Now'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Announcement</p>
                        <h3 className="text-xl font-bold text-slate-900">Send Announcement</h3>
                    </div>
                    <button onClick={() => setBroadcastModal(null)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-2xl text-orange-800 text-xs font-bold leading-relaxed mb-2 border border-orange-100">
                        <Megaphone size={16} className="inline mr-2 mb-0.5"/>
                        Sending to all students in <span className="font-bold">{broadcastModal.courseTitle}</span>.
                    </div>
                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all min-h-[120px] resize-none" placeholder="Type your announcement here..." value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} />
                    <button onClick={handleBroadcast} disabled={actionLoading} className="w-full py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest mt-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95">
                        {actionLoading ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Send Message
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper function to extract YouTube ID (copied from BrowseCourses.tsx)
const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2]?.length === 11) ? match[2] : null;
};