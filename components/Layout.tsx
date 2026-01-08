
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
      className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all duration-500 group relative overflow-hidden active:scale-95 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-lg'}`}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`p-2 rounded-xl transition-colors duration-500 ${active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
          <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
        </div>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {active && <ChevronRight size={14} className="text-white/70 relative z-10" />}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-4">
      <nav className="glass-dark w-full md:w-64 flex-shrink-0 flex flex-col z-50 rounded-2xl shadow-2xl relative overflow-hidden animate-in slide-in-from-left-8 duration-700">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg rotate-6 animate-float">
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white">
                edu<span className="text-indigo-400">meet</span>
              </h1>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {user && (
            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                <UserCircle size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">{user.name}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400/80">{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className={`flex-1 py-10 px-6 space-y-3 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            {user.role === UserRole.STUDENT && (
              <>
                <NavItem icon={Compass} label="Discovery" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={BookOpen} label="Curricula" path="#/my-courses" active={window.location.hash === '#/my-courses'} />
              </>
            )}
            {user.role === UserRole.TUTOR && (
              <>
                <NavItem icon={LayoutDashboard} label="Dashboard" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={PlusCircle} label="Architect" path="#/create-course" active={window.location.hash === '#/create-course'} />
              </>
            )}
            {user.role === UserRole.ADMIN && (
              <>
                <NavItem icon={LayoutDashboard} label="Analytics" path="#/" active={window.location.hash === '#/' || window.location.hash === ''} />
                <NavItem icon={Shield} label="Infrastructure" path="#/admin" active={window.location.hash === '#/admin'} />
              </>
            )}
          </div>
        )}

        {user && (
          <div className={`p-6 border-t border-white/5 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 text-slate-400 hover:text-rose-400 transition-all duration-300 w-full px-4 py-3 rounded-xl hover:bg-rose-400/10 font-black text-xs uppercase tracking-widest"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </nav>

      <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] overflow-hidden relative">
        <header className="glass h-16 flex items-center justify-between px-6 rounded-2xl mb-4 shadow-xl flex-shrink-0 z-40">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Operational Unit</p>
              <p className="text-slate-900 font-black text-sm">{user?.role?.toUpperCase()} PORTAL</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Production Hub
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  className={`relative p-3 rounded-xl transition-all duration-500 ${showNotifs ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-600/10' : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600'}`}
                  onClick={() => setShowNotifs(!showNotifs)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-4 w-80 glass rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Signal Hub</h3>
                    </div>
                    <div className="max-h-[450px] overflow-y-auto p-4 space-y-2">
                      {safeNotifications.length === 0 ? (
                        <p className="p-6 text-center text-slate-400 text-xs font-black uppercase tracking-widest">No signals</p>
                      ) : (
                        safeNotifications.map(notif => (
                          <div key={notif._id} className={`p-4 rounded-xl border transition-all ${!notif.read ? 'bg-indigo-50/50 border-indigo-100' : 'bg-transparent border-transparent grayscale'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-black text-[9px] text-indigo-600 uppercase">{notif.fromName}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium mb-4">{notif.message}</p>
                            {!notif.read && (
                              <button 
                                onClick={() => handleMarkRead(notif._id)}
                                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                              >
                                Acknowledge
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

        <main className="flex-1 overflow-auto rounded-2xl glass p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
