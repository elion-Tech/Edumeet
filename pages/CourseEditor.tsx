
import React, { useState, useEffect } from 'react';
import { Course, Module, Quiz, Capstone, User, CapstoneType, UserRole } from '../types';
import { api } from '../services/apiService';
import { generateCourseContent, generateCourseImage } from '../services/geminiService';
import { Plus, Trash2, Save, FileText, HelpCircle, Award, Video, DollarSign, Loader2, Sparkles, Wand2, Eye, Image as ImageIcon, CheckCircle2, Circle } from 'lucide-react';

interface CourseEditorProps {
  user: User;
  onNavigate: (path: string) => void;
  editCourseId?: string; 
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ user, onNavigate, editCourseId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [price, setPrice] = useState<number>(0);
  
  const [originalCourse, setOriginalCourse] = useState<Course | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [capstone, setCapstone] = useState<Capstone | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editCourseId);
  
  const [generating, setGenerating] = useState<{type: string, id: string | number} | null>(null);

  useEffect(() => {
    let mounted = true;
    if (editCourseId) {
        const loadCourseData = async (id: string) => {
            const res = await api.courses.getById(id);
            if (!mounted) return;
            const course = res.data;
            if (course) {
                setOriginalCourse(course);
                setTitle(course.title);
                setDescription(course.description);
                setThumbnailUrl(course.thumbnailUrl || '');
                setPrice(course.price);
                setModules(course.modules);
                setQuizzes(course.quizzes);
                setCapstone(course.capstone);
            } else {
                alert("Course not found!");
                onNavigate('#/');
            }
            setLoading(false);
        };
        loadCourseData(editCourseId);
    }
    return () => { mounted = false; };
  }, [editCourseId]);

  const addModule = () => {
    if (modules.length >= 10) {
      alert("Maximum 10 modules allowed per course.");
      return;
    }
    const newModule: Module = {
      _id: `m_${Date.now()}_${modules.length}`,
      title: `Module ${modules.length + 1}`,
      order: modules.length + 1,
      videoUrl: '',
      lessonContent: '',
      transcript: ''
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const deleteModule = (index: number) => {
    const updated = modules.filter((_, i) => i !== index);
    setModules(updated);
  };

  const addQuiz = () => {
    if (quizzes.length >= 2) {
      alert("Maximum 2 quizzes allowed per course.");
      return;
    }
    const newQuiz: Quiz = {
      _id: `q_${Date.now()}`,
      title: quizzes.length === 0 ? 'Mid-term Examination' : 'Final Examination',
      questions: []
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  const addQuestion = (quizIndex: number) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions.push({
      id: `qu_${Date.now()}`,
      text: 'Question text',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0
    });
    setQuizzes(updatedQuizzes);
  };

  const updateQuestion = (quizIndex: number, qIndex: number, field: string, value: any) => {
    const updatedQuizzes = [...quizzes];
    const q = updatedQuizzes[quizIndex].questions[qIndex];
    if (field === 'text') q.text = value;
    if (field === 'correctIndex') q.correctIndex = Number(value);
    setQuizzes(updatedQuizzes);
  };
  
  const updateOption = (quizIndex: number, qIndex: number, optIndex: number, value: string) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions[qIndex].options[optIndex] = value;
    setQuizzes(updatedQuizzes);
  };

  const toggleCapstone = () => {
    if (capstone) {
      setCapstone(undefined);
    } else {
      setCapstone({
        _id: `cap_${Date.now()}`,
        instructions: '',
        type: CapstoneType.PROJECT
      });
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!title || !description) return alert("Please fill Title and Description first.");
    setGenerating({ type: 'thumbnail', id: 'global' });
    const img = await generateCourseImage(title, description);
    if (img) setThumbnailUrl(img);
    else alert("Image generation failed.");
    setGenerating(null);
  };

  const handleGenerateModuleContent = async (index: number, field: 'lessonContent' | 'transcript') => {
    const module = modules[index];
    if (!title) return alert("Please enter a Course Title first.");
    if (!module.title) return alert("Please enter a Module Title first.");

    setGenerating({ type: field, id: index });
    const result = await generateCourseContent(
      field === 'lessonContent' ? 'description' : 'transcript', 
      module.title, 
      title
    );
    
    if (result) {
      updateModule(index, field, result);
    } else {
      alert("AI generation failed. Please try again.");
    }
    setGenerating(null);
  };

  const handleGenerateQuiz = async (index: number) => {
    if (!title) return alert("Please enter a Course Title first.");
    setGenerating({ type: 'quiz', id: index });

    const result = await generateCourseContent('quiz', 'General Assessment', title);
    
    if (!result || result === 'undefined') {
        alert("AI could not generate a valid quiz response.");
        setGenerating(null);
        return;
    }

    try {
      const cleanResult = result.replace(/```json|```/gi, '').trim();
      if (!cleanResult) throw new Error("Result is empty after cleaning.");
      const questions = JSON.parse(cleanResult);
      if (Array.isArray(questions)) {
        const updatedQuizzes = [...quizzes];
        updatedQuizzes[index].questions = questions.map((q: any, i: number) => ({
          id: `ai_q_${Date.now()}_${i}`,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex
        }));
        setQuizzes(updatedQuizzes);
      }
    } catch (e) {
      console.error("AI Quiz Parsing Failure:", e);
      alert("Failed to parse AI quiz structure. Please try regenerating.");
    }
    setGenerating(null);
  };

  const handleSubmit = async (e: React.FormEvent, preview: boolean = false) => {
    if (e) e.preventDefault();
    if (modules.length !== 10) {
      return alert(`Course MUST have exactly 10 modules. You have ${modules.length}.`);
    }
    
    setSaving(true);
    
    const isEditing = !!editCourseId && !!originalCourse;
    const finalTutorId = isEditing ? originalCourse.tutorId : user._id;
    const finalTutorName = isEditing ? originalCourse.tutorName : user.name;

    const newCourse: Course = {
      _id: editCourseId || `c_${Date.now()}`,
      title,
      description,
      thumbnailUrl,
      price,
      tutorId: finalTutorId,
      tutorName: finalTutorName,
      createdAt: isEditing ? originalCourse.createdAt : new Date().toISOString(),
      published: false,
      modules,
      quizzes,
      capstone: capstone 
    };

    await api.courses.save(newCourse);
    setSaving(false);
    if (preview) {
        onNavigate(`#/course/${newCourse._id}`);
    } else {
        if (user.role === UserRole.ADMIN) onNavigate('#/admin');
        else onNavigate('#/');
    }
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="font-bold">Retrieving Curriculum Data...</p>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-200">
        <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Manage Course</p>
            <h2 className="text-xl font-black text-slate-900">{editCourseId ? 'Update Master Course' : 'Create New Curriculum'}</h2>
        </div>
        <div className="flex gap-3">
          {editCourseId && (
            <button
                onClick={(e) => handleSubmit(e, true)}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
            >
                <Eye size={18} />
                Preview
            </button>
          )}
          <button
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Publish Master'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Title</label>
                    <input
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-800"
                    placeholder="Enter Course Title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Learning Objective</label>
                    <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-700 min-h-[80px]"
                    placeholder="Describe the knowledge transfer goals..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Fee (NGN)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-400 font-bold">₦</span>
                        <input
                        type="number"
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-black text-slate-900"
                        placeholder="5000"
                        value={price}
                        onChange={e => setPrice(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center relative overflow-hidden group">
                {thumbnailUrl ? (
                    <>
                        <img src={thumbnailUrl} alt="Cover" className="w-full h-full object-cover rounded-xl absolute inset-0 opacity-80" />
                        <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/60 transition-all"></div>
                        <button 
                            onClick={handleGenerateThumbnail}
                            disabled={!!generating}
                            className="relative z-10 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/30 hover:bg-white/40 transition-all flex items-center gap-2"
                        >
                            {generating?.type === 'thumbnail' ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                            Refresh Image
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                           {generating?.type === 'thumbnail' ? <Loader2 className="animate-spin" /> : <ImageIcon size={32} />}
                        </div>
                        <button 
                            onClick={handleGenerateThumbnail}
                            disabled={!!generating}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Sparkles size={16} /> Generate AI Vision
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Video size={16} className="text-indigo-600" />
            Module Architecture ({modules.length}/10)
          </h3>
          <button 
            type="button"
            onClick={addModule}
            className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all"
            disabled={modules.length >= 10}
          >
            + Create Module
          </button>
        </div>
        
        <div className="grid gap-4">
          {modules.map((module, i) => (
            <div key={module._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Section 0{i + 1}</span>
                <button onClick={() => deleteModule(i)} className="text-slate-300 hover:text-red-600 p-2 transition-colors"><Trash2 size={16} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50"
                    placeholder="Lesson Title"
                    value={module.title}
                    onChange={e => updateModule(i, 'title', e.target.value)}
                  />
                   <input
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] outline-none focus:ring-4 focus:ring-indigo-50"
                    placeholder="YouTube Resource URL"
                    value={module.videoUrl}
                    onChange={e => updateModule(i, 'videoUrl', e.target.value)}
                  />
              </div>
              
              <div className="relative">
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm pr-12 focus:ring-4 focus:ring-indigo-50 outline-none resize-none font-medium text-slate-700"
                  placeholder="Curriculum Content Description"
                  rows={2}
                  value={module.lessonContent}
                  onChange={e => updateModule(i, 'lessonContent', e.target.value)}
                />
                <button 
                  onClick={() => handleGenerateModuleContent(i, 'lessonContent')}
                  disabled={!!generating}
                  className="absolute right-3 top-3 text-indigo-600 hover:text-indigo-800"
                >
                  {generating?.type === 'lessonContent' && generating.id === i ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16} />}
                </button>
              </div>

              <div className="relative">
                <textarea
                  className="w-full p-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] pr-12 focus:ring-4 focus:ring-slate-800 outline-none resize-none font-mono"
                  placeholder="AI Knowledge Base / Transcript (Auto-generated)"
                  rows={3}
                  value={module.transcript}
                  onChange={e => updateModule(i, 'transcript', e.target.value)}
                />
                <button 
                  onClick={() => handleGenerateModuleContent(i, 'transcript')}
                  disabled={!!generating}
                  className="absolute right-3 top-3 text-indigo-400 hover:text-indigo-200"
                >
                  {generating?.type === 'transcript' && generating.id === i ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <HelpCircle size={16} className="text-indigo-600" />
            Assessment Layers ({quizzes.length}/2)
          </h3>
          <button 
            onClick={addQuiz}
            className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all"
            disabled={quizzes.length >= 2}
          >
            + Add Examination
          </button>
        </div>
        {quizzes.map((quiz, qzIdx) => (
          <div key={quiz._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
                <input className="bg-transparent font-black text-xl text-slate-900 outline-none w-full" value={quiz.title} onChange={e => {
                    const n = [...quizzes]; n[qzIdx].title = e.target.value; setQuizzes(n);
                }} />
                <button onClick={() => handleGenerateQuiz(qzIdx)} disabled={!!generating} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100">
                     {generating?.type === 'quiz' && generating.id === qzIdx ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                     AI Synthesize Questions
                </button>
            </div>
            <div className="space-y-4">
                {quiz.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-slate-400">Q{qIdx + 1}</span>
                            <input className="w-full bg-transparent p-1 font-bold text-slate-800 outline-none border-b border-slate-200 focus:border-indigo-400" value={q.text} onChange={e => updateQuestion(qzIdx, qIdx, 'text', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${q.correctIndex === oIdx ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                    <input type="radio" className="w-4 h-4 text-indigo-600" checked={q.correctIndex === oIdx} onChange={() => updateQuestion(qzIdx, qIdx, 'correctIndex', oIdx)} />
                                    <input className="bg-transparent text-xs font-bold text-slate-600 w-full outline-none" value={opt} onChange={e => updateOption(qzIdx, qIdx, oIdx, e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => addQuestion(qzIdx)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-2">+ Manually Inject Question</button>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Award size={16} className="text-emerald-600" />
            Final Mastery (Capstone)
          </h3>
          <button 
            onClick={toggleCapstone}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${capstone ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {capstone ? <Trash2 size={14} /> : <Plus size={14} />}
            {capstone ? 'Remove Capstone' : 'Include Capstone Project'}
          </button>
        </div>
        
        {capstone && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 animate-in zoom-in duration-300">
             <div className="flex items-center gap-4 mb-2">
                <button 
                    onClick={() => setCapstone({...capstone, type: CapstoneType.PROJECT})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${capstone.type === CapstoneType.PROJECT ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                    {capstone.type === CapstoneType.PROJECT ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                    Practical Project
                </button>
                <button 
                    onClick={() => setCapstone({...capstone, type: CapstoneType.FINAL_EXAM})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${capstone.type === CapstoneType.FINAL_EXAM ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                    {capstone.type === CapstoneType.FINAL_EXAM ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                    Theoretical Thesis
                </button>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Instructions</label>
                <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-700 min-h-[120px]"
                    placeholder="Clearly define the final assessment criteria..."
                    value={capstone.instructions}
                    onChange={e => setCapstone({...capstone, instructions: e.target.value})}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
