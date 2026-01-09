
import React, { useEffect, useState } from 'react';
import { Course, User, UserRole, Progress } from '../types';
import { api } from '../services/apiService';
import { Edit, Users, Award, CheckCircle, Video, Calendar, Loader2, Trash2, X, Phone, Mail, User as UserIcon, ShieldCheck, Megaphone, Send, PlusCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [enrolledStudents, setEnrolledStudents] = useState<{user: User, progress: Progress | null}[]>([]);
  
  const [gradingModal, setGradingModal] = useState<{progressId: string, userId: string, studentName: string, submission: string} | null>(null);
  const [liveSessionModal, setLiveSessionModal] = useState<{courseId: string, courseTitle: string} | null>(null);
  const [broadcastModal, setBroadcastModal] = useState<{courseId: string, courseTitle: string} | null>(null);
  
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [lsTopic, setLsTopic] = useState('');
  const [lsDate, setLsDate] = useState('');
  const [lsLink, setLsLink] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await api.courses.getAll();
    const allCourses = res.data ?? [];
    const filtered = user.role === UserRole.TUTOR ? allCourses.filter(c => c.tutorId === user._id) : allCourses;
    setCourses(filtered);
    if (filtered.length > 0) {
        setSelectedCourseId(filtered[0]._id);
        fetchStudents(filtered[0]._id);
    }
    setLoading(false);
  };

  const fetchStudents = async (cId: string) => {
      setSelectedCourseId(cId);
      const res = await api.courses.getEnrolledStudents(cId);
      setEnrolledStudents(res.data ?? []);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course permanently?')) return;
    await api.courses.delete(courseId);
    loadData();
  };

  const submitGrade = async () => {
      if (!gradingModal) return;
      setActionLoading(true);
      await api.progress.gradeCapstone(gradingModal.progressId, gradeScore, gradeFeedback);
      await api.notifications.send({
          userId: gradingModal.userId,
          fromName: user.name,
          message: `Your project has been graded: ${gradeScore}%`,
          type: 'grade'
      });
      setGradingModal(null);
      fetchStudents(selectedCourseId);
      setActionLoading(false);
  };

  const handleScheduleLive = async () => {
      if (!liveSessionModal || !lsTopic || !lsDate || !lsLink) return;
      setActionLoading(true);
      await api.courses.scheduleLive(liveSessionModal.courseId, { topic: lsTopic, date: lsDate, meetingLink: lsLink, isActive: true });
      setLiveSessionModal(null);
      setActionLoading(false);
      alert("Live class scheduled.");
  };

  const handleBroadcast = async () => {
      if (!broadcastModal || !broadcastMessage.trim()) return;
      setActionLoading(true);
      const res = await api.courses.getEnrolledStudents(broadcastModal.courseId);
      const students = res.data ?? [];
      const promises = students.map(s => api.notifications.send({
          userId: s.user._id,
          fromName: user.name,
          message: `[Broadcast] ${broadcastModal.courseTitle}: ${broadcastMessage}`,
          type: 'announcement'
      }));
      await Promise.all(promises);
      setActionLoading(false);
      setBroadcastModal(null);
      setBroadcastMessage('');
      alert(`Broadcast sent to ${students.length} students.`);
  };

  if (loading) return <div className="text-center py-20 flex flex-col items-center gap-4 animate-in fade-in"><Loader2 className="animate-spin text-orange-600" size={32} /><p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading Dashboard</p></div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="bg-white/70 backdrop-blur-3xl rounded-[32px] p-8 shadow-xl border border-white/40 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-200 shrink-0">
              <UserIcon size={40} />
          </div>
          <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                <span className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-100 shadow-sm">
                    <ShieldCheck size={14} /> Instructor
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-500">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                      <Mail size={18} className="text-orange-400" />
                      <span className="text-base font-bold">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                      <Phone size={18} className="text-orange-400" />
                      <span className="text-base font-bold">{user.phoneNumber || 'No Phone Number'}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
           <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Courses</h2>
           <p className="text-slate-500 text-sm font-medium">Manage your courses and students</p>
        </div>
        <button onClick={() => onNavigate('#/create-course')} className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-6 py-3 rounded-full flex items-center gap-2 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-orange-600/20 active:scale-95">
          <PlusCircle size={16} /> Create New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(courses ?? []).length === 0 ? (
              <div className="col-span-full py-16 glass rounded-[32px] border-dashed border-2 border-slate-200/50 text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No courses created yet</p>
              </div>
          ) : (
              courses.map(course => (
                <div key={course._id} className={`bg-white/70 backdrop-blur-2xl p-6 rounded-[32px] shadow-lg border transition-all duration-300 ${selectedCourseId === course._id ? 'border-orange-600 shadow-orange-600/10' : 'border-white/40 hover:border-orange-200'}`}>
                    <h3 className="text-lg font-bold text-slate-900 truncate mb-6 tracking-tight">{course.title}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => fetchStudents(course._id)} className={`col-span-2 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCourseId === course._id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>View Students</button>
                        <button onClick={() => onNavigate(`#/edit-course/${course._id}`)} className="p-2.5 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-all flex items-center justify-center text-slate-600"><Edit size={16} /></button>
                        <button onClick={() => setBroadcastModal({courseId: course._id, courseTitle: course.title})} className="p-2.5 bg-orange-50 border border-orange-100 rounded-full hover:bg-orange-100 transition-all flex items-center justify-center text-orange-600"><Megaphone size={16} /></button>
                        <button onClick={() => setLiveSessionModal({courseId: course._id, courseTitle: course.title})} className="p-2.5 bg-rose-50 border border-rose-100 rounded-full hover:bg-rose-100 transition-all flex items-center justify-center text-rose-600"><Video size={16} /></button>
                        <button onClick={() => handleDelete(course._id)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center text-slate-300"><Trash2 size={16} /></button>
                    </div>
                </div>
              ))
          )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Users size={16} className="text-orange-600" /> Enrolled Students</h3>
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr><th className="px-6 py-4">Student Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(enrolledStudents ?? []).length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No students enrolled yet</td></tr>
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
                                <td className="px-6 py-4 text-right">
                                    {item.progress?.capstoneStatus === 'submitted' && (
                                        <button onClick={() => setGradingModal({progressId: item.progress!._id, userId: item.user._id, studentName: item.user.name, submission: item.progress!.capstoneSubmissionText || ''})} className="bg-orange-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md shadow-orange-100">Review Submission</button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {gradingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Grading</p>
                        <h3 className="text-xl font-bold text-slate-900">Grade Project</h3>
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

      {liveSessionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Live Class</p>
                        <h3 className="text-xl font-bold text-slate-900">Schedule Session</h3>
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
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" placeholder="https://meet.google.com/..." value={lsLink} onChange={e => setLsLink(e.target.value)} />
                    </div>
                    <button onClick={handleScheduleLive} disabled={actionLoading} className="w-full py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest mt-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95">
                        {actionLoading ? <Loader2 className="animate-spin"/> : <Video size={18}/>} Schedule Now
                    </button>
                </div>
            </div>
        </div>
      )}

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
