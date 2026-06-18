
import React, { useEffect, useState } from 'react';
import { Course, User, UserRole, Progress, LiveSession } from '../types';
import { api } from '../services/apiService';
import { Edit, Users, Award, CheckCircle, Video, Calendar, Loader2, Trash2, X, Phone, Mail, User as UserIcon, ShieldCheck, Megaphone, Send, PlusCircle, Clock, ExternalLink, ToggleRight, ToggleLeft, BookOpen } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [enrolledStudents, setEnrolledStudents] = useState<{user: User, progress: Progress | null}[]>([]);
  
  const [gradingModal, setGradingModal] = useState<{progressId: string, userId: string, studentName: string, submission: string, courseTitle: string} | null>(null);
  const [tutorLiveSessions, setTutorLiveSessions] = useState<LiveSession[]>([]);
  const [editingLiveSession, setEditingLiveSession] = useState<LiveSession | null>(null);
  const [liveSessionModalCourse, setLiveSessionModalCourse] = useState<Course | null>(null);
  const [broadcastModal, setBroadcastModal] = useState<{courseId: string, courseTitle: string} | null>(null);
  
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [lsTopic, setLsTopic] = useState('');
  const [lsDate, setLsDate] = useState('');
  const [lsMeetingLink, setLsMeetingLink] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await api.courses.getAll('all');
    const allCourses = res.data?.filter(Boolean) ?? []; // Ensure no null/undefined courses
    const filtered = user.role === UserRole.TUTOR ? allCourses.filter(c => c.tutorId === user._id) : allCourses;
    setLoading(false);
    setCourses(filtered); // Set courses after loading is complete
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course permanently?')) return;
    await api.courses.delete(courseId);
    loadData();
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
                    <h3 className="text-lg font-bold text-slate-900 truncate mb-4 tracking-tight">{course.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{course.description}</p>
                    <div className="flex gap-3">
                        <button onClick={() => onNavigate(`#/course-details/${course._id}`)} className="flex-1 py-2.5 bg-orange-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2">
                            <BookOpen size={16} /> View Details
                        </button>
                        <button onClick={() => onNavigate(`#/edit-course/${course._id}`)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-slate-600">
                            <Edit size={16} /> Edit Course
                        </button>
                        <button onClick={() => handleDelete(course._id)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center text-slate-300">
                            <Trash2 size={16} />
                        </button>
                            </div>
                </div>
              ))
          )}
      </div>

    </div>
  );
};
