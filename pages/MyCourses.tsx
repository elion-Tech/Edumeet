
import React, { useEffect, useState } from 'react';
import { Course, User, Progress, LiveSession, CourseLiveSession } from '../types';
import { api } from '../services/apiService';
import { Book, PlayCircle, CheckCircle, Award, Video, Calendar, ExternalLink, Clock, Loader2, BookOpen, Trash2 } from 'lucide-react';

interface MyCoursesProps {
  user: User;
  onNavigate: (path: string) => void;
  onUserUpdate: (user: User) => void;
}

export const MyCourses: React.FC<MyCoursesProps> = ({ user, onNavigate, onUserUpdate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [allActiveLiveSessions, setAllActiveLiveSessions] = useState<CourseLiveSession[]>([]);

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

  const handleUnenroll = async (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;

    if (window.confirm(`Are you sure you want to unenroll from "${course.title}"? All your progress will be permanently deleted.`)) {
      const res = await api.users.unenroll(user._id, courseId);
      if (res.data) {
        // This is the critical fix: update the user state in App.tsx
        onUserUpdate(res.data);
      } else {
        alert(res.error || "Failed to unenroll. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (user?.enrolledCourseIds?.length > 0 && courses.length > 0) {
      const fetchAllLiveSessions = async () => {
        const allSessions: CourseLiveSession[] = [];
        for (const course of courses) { // courses state is already filtered by enrollment
          const res = await api.courses.getLiveSessionsByCourse(course._id);
          if (res.data) {
            const activeCourseSessions = res.data
              .filter((ls: LiveSession) => ls.isActive)
              .map((ls: LiveSession) => ({
                courseId: course._id,
                courseTitle: course.title,
                tutorName: course.tutorName,
                session: ls
              }));
            allSessions.push(...activeCourseSessions);
          }
        }
        setAllActiveLiveSessions(allSessions.sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime()));
      };
      fetchAllLiveSessions();
    }
  }, [courses, user.enrolledCourseIds]); // Depend on courses and enrolledIdsFingerprint

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2]?.length === 11) ? match[2] : null;
  };

  const calculateGradeDetails = (course: Course, prog: Progress | undefined) => {
      if (!prog) return { total: 0, modules: 0, quizzes: [], capstone: undefined, isComplete: false };
      
      const modules = course.modules ?? [];
      const quizzes = course.quizzes ?? [];
      const capstoneConfig = course.capstone;
      const completedModuleIds = prog.completedModuleIds ?? [];
      const quizResults = prog.quizResults ?? [];

      let currentWeightedScore = 0;
      let maxPossibleWeightedScore = 0;

      // Define base weights, these will be used if the component exists
      const MODULE_WEIGHT = modules.length > 0 ? 20 : 0;
      const QUIZ_WEIGHT = quizzes.length > 0 ? (quizzes.length === 1 ? 40 : 20) : 0; // Single quiz has more weight
      const CAPSTONE_WEIGHT = capstoneConfig ? 40 : 0;

      const gradeBreakdown: { modules: number, quizzes: { id: string, title: string, score: number, passed: boolean }[], capstone?: number } = {
          modules: 0,
          quizzes: [],
          capstone: undefined
      };

      // 1. Modules contribution
      let isModulesComplete = true;
      if (modules.length > 0) {
          maxPossibleWeightedScore += MODULE_WEIGHT;
          const completedModuleCount = completedModuleIds.length;
          const moduleCompletionPercentage = (completedModuleCount / modules.length) * 100;
          currentWeightedScore += (moduleCompletionPercentage / 100) * MODULE_WEIGHT;
          gradeBreakdown.modules = Math.round(moduleCompletionPercentage * 10) / 10;
          isModulesComplete = completedModuleCount === modules.length;
      } else {
          isModulesComplete = true;
      }

      // 2. Quizzes contribution
      const quizCompletionStatus: { id: string, passed: boolean }[] = [];
      quizzes.forEach((q) => {
          maxPossibleWeightedScore += QUIZ_WEIGHT;
          const result = quizResults.find(r => r.quizId === q._id);
          let quizScore = 0;
          let quizPassed = false;
          if (result) {
              quizScore = result.score;
              quizPassed = result.passed;
              currentWeightedScore += (quizScore / 100) * QUIZ_WEIGHT;
          }
          const quizTitle = quizzes.length === 1 ? 'Final Assessment' : q.title;
          gradeBreakdown.quizzes.push({ id: q._id, title: quizTitle, score: Math.round(quizScore * 10) / 10, passed: quizPassed });
          quizCompletionStatus.push({ id: q._id, passed: quizPassed });
      });
      const areQuizzesComplete = quizzes.length === 0 || quizCompletionStatus.every(qs => qs.passed);

      // 3. Capstone contribution
      let isCapstoneComplete = true;
      if (capstoneConfig && prog.capstoneStatus) {
          maxPossibleWeightedScore += CAPSTONE_WEIGHT;
          if (prog.capstoneStatus === 'graded' && prog.capstoneGrade !== undefined) {
              currentWeightedScore += (prog.capstoneGrade / 100) * CAPSTONE_WEIGHT;
              gradeBreakdown.capstone = Math.round(prog.capstoneGrade * 10) / 10;
              isCapstoneComplete = true;
          } else {
              gradeBreakdown.capstone = 0;
              isCapstoneComplete = false;
          }
      } else {
          isCapstoneComplete = true;
      }

      // Calculate overall total percentage
      let total = 0;
      if (maxPossibleWeightedScore > 0) {
          total = (currentWeightedScore / maxPossibleWeightedScore) * 100;
      } else {
          total = 100; // If no components, consider 100% complete (e.g., an empty course, though unlikely)
      }

      const isCourseComplete = isModulesComplete && areQuizzesComplete && isCapstoneComplete;

      return {
          total,
          modules: gradeBreakdown.modules,
          quizzes: gradeBreakdown.quizzes,
          capstone: gradeBreakdown.capstone,
          isComplete: isCourseComplete
      };
  };

  // Use the new state for live sessions
  const liveSessions = allActiveLiveSessions;

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
                const { total, modules: moduleProgress, quizzes: quizGrades, capstone, isComplete } = calculateGradeDetails(course, prog);
                const courseModules = course.modules ?? [];
                const videoId = courseModules[0] ? getYoutubeId(courseModules[0].videoUrl) : null;
                const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : (course.thumbnailUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800');

                return (
                <div key={course._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col relative group">
                    <button 
                        onClick={() => handleUnenroll(course._id)}
                        className="absolute top-3 right-3 z-10 p-2 bg-slate-100/70 backdrop-blur-md rounded-full text-slate-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                        title="Unenroll from this course"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className="h-36 bg-slate-800 relative overflow-hidden">
                        <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{course.title}</h3>
                        <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-tighter">Instructor: {course.tutorName}</p>
                        {prog ? (
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</span>
                                    <span className="text-xl font-bold text-indigo-600">{total}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-4">
                                    <div className="h-1.5 bg-indigo-600 rounded-full transition-all" style={{ width: `${total}%` }}></div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-200/50">
                                    {courseModules.length > 0 && (
                                        <div className="text-center">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Modules</div>
                                            <div className="text-[10px] font-bold text-slate-700">{moduleProgress}%</div>
                                        </div>
                                    )}
                                    {quizGrades.map((qg) => (
                                        <div key={qg.id} className="text-center">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{qg.title.split(' ')[0]}</div>
                                            <div className="text-[10px] font-bold text-slate-700">{qg.score}%</div>
                                        </div>
                                    ))}
                                    {capstone !== undefined && (
                                        <div className="text-center">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Capstone</div>
                                            <div className="text-[10px] font-bold text-slate-700">{capstone}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center text-slate-500 text-sm font-medium">
                                No progress yet.
                            </div>
                        )}
                        <button onClick={() => onNavigate(`#/course/${course._id}`)} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                            {isComplete ? <Award size={16}/> : <PlayCircle size={16}/>} {isComplete ? 'View Certificate' : 'Resume Session'}
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
