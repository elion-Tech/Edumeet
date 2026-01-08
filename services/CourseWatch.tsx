import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { api } from '../services/apiService';
import { User, Course, Progress } from '../types';
import { ChevronLeft, CheckCircle, PlayCircle, Loader, ArrowRight } from 'lucide-react';

interface CourseWatchProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const CourseWatch: React.FC<CourseWatchProps> = ({ user, onLogout, onNavigate }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Extract IDs from URL hash: #/course/:courseId/learn/:moduleId
  const getParams = () => {
    const parts = window.location.hash.split('/');
    return { courseId: parts[2], moduleId: parts[4] };
  };

  const { courseId, moduleId } = getParams();

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !user._id) return;
      try {
        setLoading(true);
        const [courseRes, progressRes] = await Promise.all([
          api.courses.getById(courseId),
          api.progress.get(user._id, courseId)
        ]);
        
        if (courseRes.data) setCourse(courseRes.data);
        if (progressRes.data) setProgress(progressRes.data);
      } catch (error) {
        console.error("Failed to load course data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, user._id, moduleId]); // Reload if module changes

  const getCurrentModule = () => {
    if (!course) return null;
    for (const chapter of course.chapters) {
      const module = chapter.modules.find((m: any) => m._id === moduleId);
      if (module) return { module, chapter };
    }
    return null;
  };

  const handleCompleteAndNext = async () => {
    if (!course || !moduleId || !user._id || completing) return;

    try {
      setCompleting(true);

      // 1. Update Progress
      const currentCompleted = progress?.completedModules || [];
      const updatedProgress = {
        userId: user._id,
        courseId: course._id,
        completedModules: [...new Set([...currentCompleted, moduleId])],
        // Preserve other progress fields if they exist
        ...progress
      } as Progress;

      await api.progress.update(updatedProgress);
      setProgress(updatedProgress);

      // 2. Find Next Module
      const allModules = course.chapters.flatMap((c: any) => c.modules);
      const currentIndex = allModules.findIndex((m: any) => m._id === moduleId);
      const nextModule = allModules[currentIndex + 1];

      // 3. Navigate
      if (nextModule) {
        onNavigate(`#/course/${course._id}/learn/${nextModule._id}`);
      } else {
        onNavigate(`#/course/${course._id}/finished`);
      }
    } catch (error) {
      console.error("Failed to save progress", error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} onNavigate={onNavigate} fullWidth={true}>
        <div className="flex items-center justify-center h-screen bg-black">
          <Loader className="animate-spin text-white" size={40} />
        </div>
      </Layout>
    );
  }

  const currentData = getCurrentModule();
  if (!currentData) return null;
  const { module } = currentData;

  return (
    <Layout user={user} onLogout={onLogout} onNavigate={onNavigate} fullWidth={true}>
      <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen bg-black">
        {/* Video Area - Takes remaining space */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <iframe 
            src={module.videoUrl} 
            className="w-full h-full absolute inset-0" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        </div>

        {/* Controls Bar - Fixed Height at Bottom */}
        <div className="h-20 bg-[#0f172a] border-t border-white/10 px-6 md:px-8 flex items-center justify-between flex-shrink-0 z-50">
          <div className="hidden md:block">
            <h2 className="font-bold text-white text-lg truncate max-w-md">{module.title}</h2>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Now Playing</p>
          </div>

          <button 
            onClick={handleCompleteAndNext}
            disabled={completing}
            className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {completing ? <Loader className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            <span>Complete & Next</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </Layout>
  );
};