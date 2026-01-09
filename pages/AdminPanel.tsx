import React, { useEffect, useState } from 'react';
import { Course, User, UserRole } from '../types';
import { api } from '../services/apiService';
import { Users, BookOpen, Shield, Trash2, Activity, Database, Unlock, Ban, Loader2, Search, Mail, X, UserPlus, ShieldCheck, Zap, Globe, Eye, EyeOff, Edit, PlusCircle, UserMinus, Send } from 'lucide-react';

interface AdminPanelProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user: currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'server'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [userMsgModal, setUserMsgModal] = useState<{ userId: string, userName: string } | null>(null);
  const [createUserModal, setCreateUserModal] = useState(false);
  
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STUDENT);

  const [serverHealth, setServerHealth] = useState<{ok: boolean, status: string} | null>(null);
  
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [c, u] = await Promise.all([api.courses.getAll(), api.users.getAll()]);
    setCourses(Array.isArray(c.data) ? c.data.filter(Boolean) : []);
    setUsers(Array.isArray(u.data) ? u.data.filter(Boolean) : []);
    setLoading(false);
  };

  const handleCheckHealth = async () => {
      setActionLoading('health');
      const res = await api.settings.checkHealth();
      setServerHealth(res);
      setActionLoading(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('creating-user');
    const newUser: User = {
        _id: `u_${Date.now()}`,
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        createdAt: new Date().toISOString(),
        enrolledCourseIds: [],
        isSuspended: false
    };
    
    const res = await api.users.save(newUser);
    if (res.status === 201 || res.status === 200) {
        alert(`${newUserRole.toUpperCase()} Account Created.`);
        setCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        await loadData();
    } else {
        alert(res.error || "Provisioning failed.");
    }
    setActionLoading(null);
  };

  const handleToggleSuspend = async (user: User) => {
      const newStatus = !user.isSuspended;
      setActionLoading(`susp-${user._id}`);
      await api.users.toggleSuspension(user._id, newStatus);
      await loadData();
      setActionLoading(null);
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm('Permanently delete this user?')) return;
      setActionLoading(`del-user-${userId}`);
      await api.users.delete(userId);
      await loadData();
      setActionLoading(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (!confirm('Permanently delete this course and all associated data?')) return;
      setActionLoading(`del-course-${courseId}`);
      await api.courses.delete(courseId);
      await loadData();
      setActionLoading(null);
  };

  const handleSendMessage = async () => {
      if (!userMsgModal || !adminMessage.trim()) return;
      setActionLoading(`msg-${userMsgModal.userId}`);
      await api.notifications.send({
          userId: userMsgModal.userId,
          fromName: 'System Administrator',
          message: adminMessage,
          type: 'announcement'
      });
      alert(`Message sent to ${userMsgModal.userName}`);
      setUserMsgModal(null);
      setAdminMessage('');
      setActionLoading(null);
  };

  const filteredUsers = users.filter(u => 
    (u?.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u?.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(c => 
    (c?.title || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c?.tutorName || '').toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-orange-600" size={32} />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading Admin Panel...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium">Manage users, courses, and system settings</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200'}`}>Users</button>
            <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'courses' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200'}`}>Courses</button>
            <button onClick={() => setActiveTab('server')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'server' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>System</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Students', val: users.length, icon: Users, color: 'orange' },
                    { label: 'Status', val: 'ONLINE', icon: Globe, color: 'blue' },
                    { label: 'Courses', val: courses.length, icon: BookOpen, color: 'purple' },
                    { label: 'Database', val: 'MongoDB Atlas', icon: Database, color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/70 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}><stat.icon size={20}/></div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-xl font-bold text-slate-900">{stat.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center gap-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-orange-600"/> User Management</h3>
                <button onClick={() => setCreateUserModal(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"><UserPlus size={16}/> Add User</button>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Search Users</h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input placeholder="Filter by name/email..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-full text-sm font-bold outline-none focus:ring-4 focus:ring-orange-50 transition-all" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                            <tr><th className="px-6 py-4">User Details</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-sm mb-1">{u.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-bold uppercase px-4 py-1.5 rounded-full border ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white border-slate-900' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${u.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            <div className={`w-2 h-2 rounded-full ${u.isSuspended ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                            {u.isSuspended ? 'Suspended' : 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleToggleSuspend(u)} className={`p-2 rounded-full transition-all ${u.isSuspended ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:text-rose-600'}`}>{u.isSuspended ? <Unlock size={16}/> : <Ban size={16}/>}</button>
                                        <button onClick={() => handleDeleteUser(u._id)} className="p-2 bg-slate-50 text-slate-300 hover:text-rose-600 rounded-full transition-all"><UserMinus size={16}/></button>
                                        <button onClick={() => setUserMsgModal({ userId: u._id, userName: u.name })} className="p-2 bg-slate-50 text-slate-300 hover:text-orange-600 rounded-full transition-all"><Mail size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center gap-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><BookOpen size={16} className="text-orange-600"/> Course Management</h3>
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input placeholder="Search courses..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                            <tr><th className="px-6 py-4">Course Title</th><th className="px-6 py-4">Instructor</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCourses.map(c => (
                                <tr key={c._id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-sm mb-1">{c.title}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{c.modules.length} Segments</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-600">{c.tutorName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-orange-600 text-sm">₦{c.price.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${c.published ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${c.published ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`}></div>
                                            {c.published ? 'Published' : 'Draft'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => onNavigate(`#/edit-course/${c._id}`)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all"><Edit size={16} className="text-slate-600"/></button>
                                        <button onClick={() => handleDeleteCourse(c._id)} className="p-2 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 rounded-full transition-all"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'server' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in duration-500">
            <div className="bg-[#0f172a] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-[2000ms]"><Zap size={120} /></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/40 animate-float"><ShieldCheck size={20}/></div>
                        <h3 className="text-2xl font-bold tracking-tight">System Status</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Environment</p>
                        <p className="text-xl font-bold">Production Server</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-orange-800 font-bold text-xs uppercase tracking-widest mb-2">
                        <Zap size={16} className="text-orange-600" /> Database Connection
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">Connected to MongoDB Atlas and Node.js backend.</p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Endpoint</label>
                    <div className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-sm text-orange-400 shadow-inner overflow-hidden truncate">
                        https://edumeetserver.onrender.com
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button onClick={handleCheckHealth} disabled={actionLoading === 'health'} className="flex-1 bg-slate-900 text-white py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all">
                        {actionLoading === 'health' ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                        Check System Health
                    </button>
                </div>

                {serverHealth && (
                    <div className={`p-4 rounded-2xl border-2 animate-in slide-in-from-top-4 flex items-center gap-4 ${serverHealth.ok ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                        <div className={`w-4 h-4 rounded-full ${serverHealth.ok ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                        <div>
                            <p className="font-bold text-[10px] uppercase tracking-widest mb-1">Status: {serverHealth.status}</p>
                            <p className="text-sm font-bold opacity-80">{serverHealth.ok ? 'System is running normally.' : 'System might be down.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {createUserModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-8">
              <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl border border-white/20 animate-in zoom-in duration-500">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">Create Account</p>
                        <h3 className="text-2xl font-bold tracking-tight">Add New User</h3>
                      </div>
                      <button onClick={() => setCreateUserModal(false)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all active:scale-90"><X size={18}/></button>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-6">Full Name</label>
                          <input required className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full font-bold outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 transition-all shadow-inner" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Professor John Doe" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-6">Email Address</label>
                          <input required className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full font-bold outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 transition-all shadow-inner" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="dean@edumeet.com" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-6">Password</label>
                          <input required type="password" className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full font-bold outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 transition-all shadow-inner" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="••••••••" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-6">Role</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full font-bold text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600 transition-all shadow-inner" value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}>
                              <option value={UserRole.STUDENT}>Student</option>
                              <option value={UserRole.TUTOR}>Tutor</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                      </div>
                      <button className="w-full bg-orange-600 text-white py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg shadow-orange-600/30 mt-6 active:scale-95 transition-all hover:bg-orange-700">Create User</button>
                  </form>
              </div>
          </div>
      )}

      {userMsgModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Message User</p>
                        <h3 className="text-xl font-bold text-slate-900">Message {userMsgModal.userName}</h3>
                    </div>
                    <button onClick={() => setUserMsgModal(null)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all min-h-[120px] resize-none" placeholder="Type your message..." value={adminMessage} onChange={e => setAdminMessage(e.target.value)} />
                    <button onClick={handleSendMessage} disabled={!!actionLoading} className="w-full py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest mt-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95">
                        {actionLoading ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Send Message
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};