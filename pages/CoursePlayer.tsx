
import React, { useEffect, useState, useRef } from 'react';
import { Course, Progress, User, ChatMessage, UserRole, Quiz, Question, QuizResult, CapstoneType } from '../types';
import { api } from '../services/apiService';
import { askAiTutorStream, speakText } from '../services/geminiService';
import { CheckCircle, MessageSquare, Send, BookOpen, Lock, Award, Loader2, Video, ArrowLeft, Mic, Volume2, X, Trophy, AlertCircle, Sparkles, ChevronRight, ChevronLeft, MicOff, Menu, Sidebar } from 'lucide-react';
import { extractVideoId } from './youtube';
import { useYouTubePlayer } from './useYouTubePlayer';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

interface CoursePlayerProps { user: User; courseId: string; onNavigate: (path: string) => void; }

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ user, courseId, onNavigate }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'module' | 'quiz' | 'capstone' | 'result'>('module');
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeQuizIdx, setActiveQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [lastQuizResult, setLastQuizResult] = useState<{score: number, passed: boolean} | null>(null);
  const [capstoneText, setCapstoneText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPreview = user.role !== UserRole.STUDENT;

  useEffect(() => { 
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      const cRes = await api.courses.getById(courseId);
      if (!mounted) return;
      if (!cRes.data) { onNavigate('#/'); return; }
      const courseData = cRes.data;
      // Defensive check: Remove any null modules to prevent crashes and index mismatches
      if (courseData.modules) courseData.modules = courseData.modules.filter(Boolean);
      
      setCourse(courseData);
      const pRes = await api.progress.get(user._id, courseId);
      if (!mounted) return;
      
      if (pRes.data) {
        setProgress(pRes.data);
        if (pRes.data.completedModuleIds.length > 0) {
            const lastIdx = pRes.data.completedModuleIds.length;
            setActiveModuleIdx(Math.min(lastIdx, (courseData.modules?.length ?? 1) - 1));
        }
      } else if (isPreview) {
        setProgress({
            _id: 'preview',
            userId: user._id,
            courseId: courseId,
            completedModuleIds: [],
            quizResults: [],
            capstoneStatus: 'pending'
        } as any);
      } else {
        setProgress(null);
      }
      setLoading(false);
    };
    loadData();
    return () => { mounted = false; };
  }, [courseId]);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);


  const markModuleComplete = async () => {
    if (isPreview || !progress || !course) return;
    const currentModule = course.modules[activeModuleIdx];
    if (progress.completedModuleIds.includes(currentModule._id)) return;
    const newProgress = { ...progress, completedModuleIds: [...progress.completedModuleIds, currentModule._id] };
    const res = await api.progress.update(newProgress);
    if (res.data) setProgress(res.data);
  };

  const handleQuizSubmit = async () => {
    if (!course || !progress) return;
    const quiz = course.quizzes[activeQuizIdx];
    let correctCount = 0;
    quiz.questions.forEach(q => { if (quizAnswers[q.id] === q.correctIndex) correctCount++; });
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70;
    const result: QuizResult = { quizId: quiz._id, score, passed, attemptedAt: new Date().toISOString() };
    setLastQuizResult({ score, passed });
    setViewMode('result');
    if (!isPreview) {
        const updatedResults = [...(progress.quizResults || [])];
        updatedResults.push(result);
        const newProgress = { ...progress, quizResults: updatedResults };
        const res = await api.progress.update(newProgress);
        if (res.data) setProgress(res.data);
    }
  };

  const handleCapstoneSubmit = async () => {
    if (!course || !progress || !capstoneText.trim()) return;
    setIsSubmitting(true);
    const newProgress = { ...progress, capstoneStatus: 'submitted' as const, capstoneSubmissionText: capstoneText };
    const res = await api.progress.update(newProgress);
    if (res.data) { setProgress(res.data); alert("Project submitted!"); setViewMode('module'); }
    setIsSubmitting(false);
  };

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = customInput || input;
    if (!finalInput.trim() || !course) return;
    setMessages(prev => [...prev, { role: 'user', text: finalInput, timestamp: Date.now() }]);
    setInput('');
    setThinking(true);
    const currentTranscript = course.modules[activeModuleIdx]?.transcript || "No transcript available.";
    try {
      let accumulatedText = "";
      const stream = askAiTutorStream(finalInput, currentTranscript, course.title);
      setMessages(prev => [...prev, { role: 'model', text: "", timestamp: Date.now() }]);
      setThinking(false);
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => {
            const last = [...prev];
            last[last.length - 1] = { ...last[last.length - 1], text: accumulatedText };
            return last;
        });
      }
      playAiVoice(accumulatedText);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "AI Grounding Error.", timestamp: Date.now() }]);
      setThinking(false);
    }
  };

  const playAiVoice = async (text: string) => {
    if (isReading) return;
    setIsReading(true);
    try {
        const base64Audio = await speakText(text);
        if (!base64Audio) { setIsReading(false); return; }
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtxRef.current, 24000, 1);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsReading(false);
        source.start();
    } catch (err) { setIsReading(false); }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => handleSendMessage(undefined, event.results[0][0].transcript);
    recognition.start();
  };

  const modules = course?.modules ?? [];
  const activeModule = modules[activeModuleIdx];
  const videoId = activeModule ? extractVideoId(activeModule.videoUrl) : null;
  const playerContainerRef = useYouTubePlayer({ 
    videoId,
    onStateChange: (event) => {
        // Placeholder for future progress tracking integration
        // event.data === 1 (PLAYING), 2 (PAUSED), 0 (ENDED)
    }
  });

  if (loading || !course || !progress) return <div className="p-20 text-center flex flex-col items-center gap-6"><div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner"><Loader2 className="animate-spin text-orange-600" size={32} /></div><p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading Operational Workspace</p></div>;

  const isMidTermReady = activeModuleIdx >= 4;
  const isFinalReady = activeModuleIdx === 9;
  const midTermPassed = progress.quizResults?.some(r => r.quizId === course.quizzes[0]?._id && r.passed);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-[32px] shadow-2xl border border-slate-200/80 overflow-hidden relative animate-in fade-in zoom-in-95 duration-1000">
      {/* Immersive Header */}
      <div className="px-6 py-4 border-b bg-white/70 backdrop-blur-3xl flex justify-between items-center z-20">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate('#/')} className="p-3 bg-slate-50 hover:bg-orange-600 hover:text-white rounded-full transition-all duration-500 active:scale-90 shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{course.title}</h2>
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">Segment {activeModuleIdx + 1} // {modules.length}</span>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                  <div className={`w-2 h-2 rounded-full ${midTermPassed ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300'}`}></div>
                  Mid-Term Clearance
                </div>
            </div>
          </div>
        </div>
        <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-full transition-all mr-4 ${sidebarOpen ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
            {sidebarOpen ? <X size={20}/> : <Sidebar size={20}/>}
        </button>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setChatOpen(!chatOpen)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-700 active:scale-95 ${chatOpen ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-600/10' : 'bg-slate-900 text-white hover:bg-black'}`}
            >
                <MessageSquare size={16}/>
                {chatOpen ? 'Hide Assistant' : 'Open AI Assistant'}
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Spatial Navigation Sidebar */}
        {sidebarOpen && <div className="w-72 bg-slate-50/70 border-r overflow-y-auto p-6 space-y-8 hidden xl:block custom-scrollbar animate-in slide-in-from-left-10 duration-300">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
                Knowledge Tree
              </p>
              <div className="space-y-4">
                {modules.map((m, idx) => {
                    const isCompleted = progress.completedModuleIds.includes(m._id);
                    const isActive = idx === activeModuleIdx && viewMode === 'module';
                    let isLocked = idx > 0 && !progress.completedModuleIds.includes(modules[idx-1]._id);
                    if (idx >= 5 && !midTermPassed) isLocked = true;

                    return (
                        <button 
                            key={m._id}
                            disabled={isLocked && !isPreview}
                            onClick={() => { setViewMode('module'); setActiveModuleIdx(idx); }}
                            className={`w-full text-left p-3 rounded-2xl transition-all duration-500 flex items-center gap-3 group relative overflow-hidden ${isActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 translate-x-2' : isLocked && !isPreview ? 'opacity-30 grayscale cursor-not-allowed scale-95' : 'hover:bg-white hover:shadow-sm hover:translate-x-1 text-slate-500'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${isActive ? 'bg-white/20' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm border border-slate-200'}`}>
                                {isCompleted ? <CheckCircle size={16}/> : isLocked && !isPreview ? <Lock size={14}/> : <span className="text-[10px] font-bold">{idx+1}</span>}
                            </div>
                            <span className="text-xs font-bold truncate tracking-tight uppercase group-hover:tracking-wider transition-all">{m.title}</span>
                            {isActive && <div className="absolute right-[-10px] top-0 bottom-0 w-6 bg-white/10 blur-xl"></div>}
                        </button>
                    );
                })}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200/80">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-3">
                    <Award size={16} className="text-amber-500"/> Assessment
                </p>
                <div className="space-y-5">
                    <button 
                        disabled={!isMidTermReady && !isPreview}
                        onClick={() => { setViewMode('quiz'); setActiveQuizIdx(0); }}
                        className={`w-full text-left p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 flex items-center justify-between group ${viewMode === 'quiz' && activeQuizIdx === 0 ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-400'}`}
                    >
                        Mid-term Exam {!isMidTermReady && <Lock size={14}/>}
                        {midTermPassed && <div className="p-1 bg-white/20 rounded-full"><CheckCircle size={14} className="text-white"/></div>}
                    </button>
                    <button 
                        disabled={!isFinalReady && !isPreview}
                        onClick={() => { setViewMode('quiz'); setActiveQuizIdx(1); }}
                        className={`w-full text-left p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 flex items-center justify-between group ${viewMode === 'quiz' && activeQuizIdx === 1 ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-400'}`}
                    >
                        Final Exam {!isFinalReady && <Lock size={14}/>}
                    </button>
                    {course.capstone && (
                      <button 
                          disabled={!isFinalReady && !isPreview}
                          onClick={() => setViewMode('capstone')}
                          className={`w-full text-left p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 flex items-center justify-between group ${viewMode === 'capstone' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}
                      >
                          Mastery Project {!isFinalReady && <Lock size={14}/>}
                      </button>
                    )}
                </div>
            </div>}
        </div>

        {/* Liquid Workspace */}
        <div className="flex-1 overflow-y-auto bg-white p-8 lg:p-12 relative animate-in fade-in slide-in-from-bottom-12 duration-[1200ms]">
            {viewMode === 'module' && activeModule && (
                <div className="max-w-6xl mx-auto space-y-16 pb-40">
                    <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-[8px] border-white ring-2 ring-slate-100 relative group animate-in zoom-in duration-1000">
                        {videoId ? (
                            <div ref={playerContainerRef} className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                                <Video size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">Video content unavailable</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-10">
                        <div className="flex flex-col xxl:flex-row justify-between items-start gap-8">
                            <h1 className="text-3xl font-black text-slate-900 leading-[1] tracking-tight">{activeModule.title}</h1>
                            <button 
                                onClick={markModuleComplete}
                                className={`px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-500 active:scale-95 whitespace-nowrap shadow-lg ${progress.completedModuleIds.includes(activeModule._id) ? 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/10' : 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-orange-600/30'}`}
                            >
                                {progress.completedModuleIds.includes(activeModule._id) ? 'Status: Mastery Verified ✓' : 'Execute Completion'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <button 
                                disabled={activeModuleIdx === 0}
                                onClick={() => setActiveModuleIdx(activeModuleIdx - 1)}
                                className="px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <ChevronLeft size={18}/> Previous Segment
                            </button>
                            <button 
                                disabled={activeModuleIdx === modules.length - 1 || (!progress.completedModuleIds.includes(activeModule._id) && !isPreview) || (activeModuleIdx === 4 && !midTermPassed && !isPreview)}
                                onClick={() => setActiveModuleIdx(activeModuleIdx + 1)}
                                className="px-6 py-3 rounded-xl bg-[#0f172a] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-black shadow-lg disabled:opacity-30 transition-all flex items-center gap-3 active:scale-95"
                            >
                                Next Section <ChevronRight size={18}/>
                            </button>
                        </div>
                        <div className="bg-slate-50/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/60 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium shadow-sm border-t-white">
                            {activeModule.lessonContent}
                        </div>
                    </div>

                    {activeModuleIdx === 4 && !midTermPassed && !isPreview && (
                        <div className="mt-8 p-6 bg-amber-50/90 backdrop-blur-3xl border border-amber-200 rounded-2xl flex items-center gap-6 text-amber-900 animate-in fade-in slide-in-from-top-10 shadow-xl shadow-amber-500/10 ring-4 ring-amber-500/5">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20 shrink-0 animate-bounce"><Lock size={24}/></div>
                            <div className="text-sm font-bold leading-relaxed">
                                Progression Gated: Secure passing score in <button onClick={() => { setViewMode('quiz'); setActiveQuizIdx(0); }} className="text-amber-600 underline decoration-8 decoration-amber-600/10 hover:decoration-amber-600/30 transition-all">Mid-term Examination</button> is required to unlock Advanced Curriculum Chapters.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Assessment and Result pages use similar spatial logic... */}
            {viewMode === 'quiz' && (
              <div className="max-w-5xl mx-auto py-16 text-center animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500 mb-6 animate-float shadow-inner border border-amber-100">
                  <Sparkles size={32}/>
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">{course.quizzes[activeQuizIdx].title}</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-10">Cognitive Verification Protocol</p>
                <div className="space-y-8 text-left max-w-3xl mx-auto">
                    {course.quizzes[activeQuizIdx].questions.map((q, qIdx) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex gap-4">
                                <span className="text-orange-600">0{qIdx + 1}.</span> {q.text}
                            </h3>
                            <div className="space-y-3">
                                {q.options.map((opt, oIdx) => (
                                    <button
                                        key={oIdx}
                                        onClick={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                                        className={`w-full text-left p-3 rounded-xl font-medium transition-all flex items-center gap-4 ${quizAnswers[q.id] === oIdx ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${quizAnswers[q.id] === oIdx ? 'border-white' : 'border-slate-300'}`}>
                                            {quizAnswers[q.id] === oIdx && <div className="w-3 h-3 bg-white rounded-full" />}
                                        </div>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleQuizSubmit} className="mt-8 bg-orange-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-lg shadow-orange-600/30 active:scale-95 hover:translate-y-[-2px] transition-all">Execute Submission</button>
              </div>
            )}

            {viewMode === 'result' && lastQuizResult && (
                <div className="max-w-4xl mx-auto py-16 text-center animate-in zoom-in duration-700">
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${lastQuizResult.passed ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {lastQuizResult.passed ? <Trophy size={48}/> : <AlertCircle size={48}/>}
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-2">{lastQuizResult.score}%</h2>
                    <p className="text-lg font-bold text-slate-500 mb-8">{lastQuizResult.passed ? 'Assessment Passed. Module Unlocked.' : 'Score below threshold. Review material and retry.'}</p>
                    <button onClick={() => { setViewMode('module'); setActiveModuleIdx(prev => Math.min(prev + 1, (course.modules?.length ?? 1) - 1)); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all">
                        Return to Course
                    </button>
                </div>
            )}

            {viewMode === 'capstone' && course.capstone && (
                <div className="max-w-4xl mx-auto py-20 animate-in slide-in-from-bottom-12">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Final Capstone Project</h2>
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                        <h3 className="text-indigo-900 font-bold mb-4 uppercase tracking-widest text-xs">Directives</h3>
                        <p className="text-indigo-800 leading-relaxed font-medium">{course.capstone.instructions}</p>
                    </div>
                    <textarea 
                        className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-50 transition-all font-medium text-slate-700 resize-none mb-6"
                        placeholder="Enter your project submission or link here..."
                        value={capstoneText}
                        onChange={e => setCapstoneText(e.target.value)}
                    />
                    <button onClick={handleCapstoneSubmit} disabled={isSubmitting} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all">
                        {isSubmitting ? 'Transmitting...' : 'Submit Final Project'}
                    </button>
                </div>
            )}
        </div>

        {/* Elevated Glass AI Instructor */}
        {chatOpen && (
            <div className="w-[400px] border-l bg-white/80 backdrop-blur-3xl flex flex-col animate-in slide-in-from-right-full duration-[800ms] z-[60] shadow-[-32px_0_128px_rgba(0,0,0,0.15)] relative">
                <div className="p-6 border-b bg-[#0f172a] text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150"><MessageSquare size={120}/></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50 animate-pulse">
                            <Sparkles size={20}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/80 mb-0.5">Grounded Assistant</p>
                            <h3 className="text-lg font-black tracking-tight">AI Assistant</h3>
                        </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all relative z-10 active:scale-90"><X size={18}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/10 custom-scrollbar">
                    <div className="bg-gradient-to-br from-orange-600 to-rose-600 text-white p-4 rounded-2xl rounded-tl-none text-xs font-bold leading-relaxed shadow-lg shadow-orange-600/30 border border-white/10 uppercase tracking-wider">
                        Analyzing operational segment: <br/><strong>"{activeModule?.title}"</strong>. <br/><br/>Query the assistant for conceptual expansion or synthesis.
                    </div>
                    {messages.map((m, i) => (
                        <div key={i} className={`p-4 rounded-2xl text-sm shadow-lg transition-all animate-in fade-in slide-in-from-bottom-6 ${m.role === 'user' ? 'bg-[#1e293b] text-white ml-10 rounded-br-none shadow-black/20' : 'glass border border-slate-200/80 text-slate-700 mr-10 rounded-bl-none leading-relaxed font-medium shadow-slate-200/50'}`}>
                            {m.text}
                            {m.role === 'model' && (
                                <button onClick={() => playAiVoice(m.text)} className="mt-3 text-orange-600 hover:text-orange-800 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                    <Volume2 size={16}/> Voice Synthesis
                                </button>
                            )}
                        </div>
                    ))}
                    {thinking && (
                        <div className="flex gap-2 p-4 ml-2">
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce shadow-lg shadow-orange-500/50"></div>
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce delay-200 shadow-lg shadow-orange-500/50"></div>
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce delay-400 shadow-lg shadow-orange-500/50"></div>
                        </div>
                    )}
                    <div ref={chatEndRef}/>
                </div>

                <div className="p-6 bg-white/50 border-t border-slate-100">
                    <div className="flex gap-3">
                        <button 
                            onClick={startVoiceInput}
                            className={`p-4 rounded-xl transition-all duration-700 active:scale-90 ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-rose-500'}`}
                        >
                            {isListening ? <Mic size={20}/> : <MicOff size={20}/>}
                        </button>
                        <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
                            <input 
                                className="w-full bg-slate-50 px-4 py-3 rounded-full text-sm outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 focus:bg-white transition-all font-bold text-slate-800 shadow-inner"
                                placeholder={isListening ? "Vocal processing..." : "Enter query..."}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button type="submit" disabled={!input.trim()} className="p-4 bg-orange-600 text-white rounded-full shadow-lg shadow-orange-600/40 hover:bg-orange-700 hover:translate-y-[-2px] active:scale-90 transition-all disabled:opacity-30">
                                <Send size={20}/>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
