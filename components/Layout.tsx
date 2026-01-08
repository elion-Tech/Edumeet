
import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';
import { LogOut, LayoutDashboard, PlusCircle, Shield, Compass, BookOpen, Bell, Check, ChevronRight, UserCircle, Sparkles, Globe, Database, Menu, X } from 'lucide-react';
import { api } from '../services/apiService';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, onNavigate, children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadNotifs();
      const interval = setInterval(loadNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  const loadNotifs = async () => {
    if (user) {
      try {
        const res = await api.notifications.getByUser(user._id);
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setNotifications([]);
      }
    }
  };

  const handleMarkRead = async (id: string) => {
    await api.notifications.markRead(id);
    loadNotifs();
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  const NavItem = ({ icon: Icon, label, path, active }: any) => (
    <button 
      onClick={() => {
        onNavigate(path);
        setIsMobileMenuOpen(false);
      }} 
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
        active 
          ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1'
      }`}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]" />}
      
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      
      <span className="font-medium text-sm tracking-wide">{label}</span>
      
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-sans selection:bg-indigo-500/30">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <nav className={`fixed md:relative inset-y-0 left-0 z-50 w-full md:w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0 md:translate-x-0'} md:h-screen overflow-hidden`}>
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen" />
            <div className="absolute top-[40%] -right-[20%] w-[60%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <div className="relative z-10 p-6 md:p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                edu<span className="text-indigo-400">meet</span>
              </h1>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {user && (
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-inner">
                <span className="font-bold text-sm">{user.name.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate tracking-wide">{user.name}</p>
                <p className="text-[11px] font-medium text-indigo-300/80 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="relative z-10 flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {user.role === UserRole.STUDENT && (
              <>
                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Discover</div>
                <NavItem icon={Compass} label="Explore Courses" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={BookOpen} label="My Learning" path="#/my-courses" active={window.location.hash === '#/my-courses'} />
              </>
            )}
            {user.role === UserRole.TUTOR && (
              <>
                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Management</div>
                <NavItem icon={LayoutDashboard} label="Dashboard" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={PlusCircle} label="Create Course" path="#/create-course" active={window.location.hash === '#/create-course'} />
              </>
            )}
            {user.role === UserRole.ADMIN && (
              <>
                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                <NavItem icon={LayoutDashboard} label="Overview" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={Database} label="Manage Users" path="#/users" active={window.location.hash === '#/users'} />
                <NavItem icon={Shield} label="Admin Panel" path="#/admin" active={window.location.hash === '#/admin'} />
              </>
            )}
          </div>
        )}

        {user && (
          <div className="relative z-10 p-6 border-t border-white/5">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 text-slate-400 hover:text-rose-400 transition-all duration-300 w-full px-4 py-3 rounded-xl hover:bg-rose-500/10 font-medium text-sm group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </nav>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative pt-20 md:pt-0">
        <header className="h-20 mx-6 mt-4 mb-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm flex items-center justify-between px-8 z-40 transition-all hover:shadow-md sticky top-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <p className="text-slate-500 text-xs font-medium mb-0.5">Welcome back,</p>
              <p className="text-slate-900 font-bold text-lg tracking-tight leading-none">{user?.name}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50/80 text-emerald-700 border border-emerald-100/50 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                System Online
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  className={`relative p-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${showNotifs ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md'}`}
                  onClick={() => setShowNotifs(!showNotifs)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                      <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-[450px] overflow-y-auto p-4 space-y-2">
                      {safeNotifications.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 text-sm">No new notifications</p>
                      ) : (
                        safeNotifications.map(notif => (
                          <div key={notif._id} className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${!notif.read ? 'bg-indigo-50/80 border-indigo-100 shadow-sm' : 'bg-transparent border-transparent opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-xs text-indigo-600">{notif.fromName}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{notif.message}</p>
                            {!notif.read && (
                              <button 
                                onClick={() => handleMarkRead(notif._id)}
                                className="w-full py-2 bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
