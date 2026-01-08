
import React, { useEffect, useState } from 'react';
import { Course, User, Progress } from '../types';
import { api } from '../services/apiService';
import { Book, PlayCircle, CheckCircle, Award, Video, Calendar, ExternalLink, Clock, Loader2, BookOpen } from 'lucide-react';

interface MyCoursesProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const MyCourses: React.FC<MyCoursesProps> = ({ user, onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  // Create a stable primitive string from the array to prevent unnecessary re-renders
  const enrolledIdsFingerprint = (user.enrolledCourseIds || []).sort().join(',');

  useEffect(() => {
    loadEnrolledCourses();
  }, [enrolledIdsFingerprint]);

  const loadEnrolledCourses = async () => {
    setLoading(true);
    const enrolledIds = user.enrolledCourseIds ?? [];
    const res = await api.courses.getAll();
    if (res.data) {
        const enrolled = res.data.filter(c => enrolledIds.includes(c._id));
        setCourses(enrolled);

        const pMap: Record<string, Progress> = {};
        await Promise.all(enrolled.map(async (c) => {
            const pRes = await api.progress.get(user._id, c._id);
            if (pRes.data) {
                pMap[c._id] = pRes.data;
            }
        }));
        setProgressMap(pMap);
    }
    setLoading(false);
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2]?.length === 11) ? match[2] : null;
  };

  const calculateGradeDetails = (course: Course, prog: Progress | undefined) => {
      if (!prog) return { total: 0, modules: 0, mid: 0, final: 0, capstone: 0 };
      
      const modules = course.modules ?? [];
      const quizzes = course.quizzes ?? [];
      const completedModules = prog.completedModuleIds ?? [];
      // Fix: Use quizResults property as defined in Progress type.
      const quizResults = prog.quizResults ?? [];

      let modulePoints = 0;
      if (modules.length > 0) {
          modulePoints = (completedModules.length / modules.length) * 20;
      }

      let midPoints = 0;
      if (quizzes.length > 0) {
          const q = quizzes[0];
          // Fix: Access quizResults instead of quizScores.
          const record = quizResults.find(s => s.quizId === q?._id);
          const qCount = q?.questions?.length ?? 0;
          if (record && qCount > 0) {
              // Fix: record.score is a percentage (0-100), adjust calculation for 20% weight.
              midPoints = (record.score / 100) * 20;
          }
      }

      let finalPoints = 0;
      if (quizzes.length > 1) {
          const q = quizzes[1];
          // Fix: Access quizResults instead of quizScores.
          const record = quizResults.find(s => s.quizId === q?._id);
          const qCount = q?.questions?.length ?? 0;
          if (record && qCount > 0) {
              // Fix: record.score is a percentage (0-100), adjust calculation for 20% weight.
              finalPoints = (record.score / 100) * 20;
          }
      }

      let capstonePoints = 0;
      if (prog.capstoneGrade !== undefined) {
          capstonePoints = (prog.capstoneGrade / 100) * 40;
      }

      const total = Math.round(modulePoints + midPoints + finalPoints + capstonePoints);
      
      return {
          total,
          modules: Math.round(modulePoints * 10) / 10,
          mid: Math.round(midPoints * 10) / 10,
          final: Math.round(finalPoints * 10) / 10,
          capstone: Math.round(capstonePoints * 10) / 10
      };
  };

  const liveSessions = (courses ?? [])
    .filter(c => c.liveSession && c.liveSession.isActive)
    .map(c => ({
        courseId: c._id,
        courseTitle: c.title,
        tutorName: c.tutorName,
        session: c.liveSession!
    }))
    .sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime());

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
      <Loader2 size={32} className="animate-spin mb-4 text-indigo-600" />
      <p>Synchronizing your learning progress...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">My Learning</h2>
            <p className="text-slate-500">Track your performance and attend live classes ({(courses ?? []).length}/3 Courses)</p>
        </div>
      </div>

      {(liveSessions ?? []).length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-bold text-slate-800">Live Classroom Updates</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {liveSessions.map((ls, idx) => (
                      <div key={idx} className="bg-white border border-red-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 group transition-all hover:shadow-md">
                          <div className="bg-red-600 text-white p-3 rounded-lg shadow-lg shadow-red-100 hidden sm:block">
                              <Video size={20} />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                              <h4 className="font-bold text-slate-900 text-base group-hover:text-red-600 transition-colors line-clamp-1">{ls.session.topic}</h4>
                              <p className="text-slate-500 text-sm mb-3">Course: {ls.courseTitle}</p>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-600">
                                  <div className="flex items-center gap-1.5"><Calendar size={14} className="text-red-400" /> {new Date(ls.session.date).toLocaleDateString()}</div>
                                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-red-400" /> {new Date(ls.session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                          </div>
                          <a href={ls.session.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                              Join <ExternalLink size={14} />
                          </a>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" />
            My Active Subscriptions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(courses ?? []).length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <Book className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">You are not enrolled in any courses.</h3>
            </div>
            ) : (
            courses.map(course => {
                const prog = progressMap[course._id];
                const grades = calculateGradeDetails(course, prog);
                const isComplete = prog && prog.capstoneStatus === 'graded';
                const modules = course.modules ?? [];
                const videoId = modules[0] ? getYoutubeId(modules[0].videoUrl) : null;
                const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : (course.thumbnailUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800');

                return (
                <div key={course._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col relative group">
                    <div className="h-36 bg-slate-800 relative overflow-hidden">
                        <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{course.title}</h3>
                        <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-tighter">Instructor: {course.tutorName}</p>
                        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</span>
                                <span className="text-xl font-bold text-indigo-600">{grades.total}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-4">
                                <div className="h-1.5 bg-indigo-600 rounded-full transition-all" style={{ width: `${grades.total}%` }}></div>
                            </div>
                            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-200/50">
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mods</div>
                                    <div className="text-[10px] font-bold text-slate-700">{grades.modules}/20</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mid</div>
                                    <div className="text-[10px] font-bold text-slate-700">{grades.mid}/20</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fin</div>
                                    <div className="text-[10px] font-bold text-slate-700">{grades.final}/20</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cap</div>
                                    <div className="text-[10px] font-bold text-slate-700">{grades.capstone}/40</div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate(`#/course/${course._id}`)} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all">
                            {isComplete ? 'Review Certification' : 'Resume Session'}
                        </button>
                    </div>
                </div>
                );
            })
            )}
        </div>
      </div>
    </div>
  );
};
