
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BrowseCourses } from './pages/BrowseCourses';
import { LandingPage } from './pages/LandingPage';
import { MyCourses } from './pages/MyCourses';
import { CourseEditor } from './pages/CourseEditor';
import { CoursePlayer } from './pages/CoursePlayer';
import { ResetPassword } from './pages/ResetPassword';
import { AdminPanel } from './pages/AdminPanel';
import { User, UserRole } from './types';
import { getCurrentUser, logout, SESSION_KEY } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<string>('');

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) setUser(storedUser);
    
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setRoute(hash || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    window.location.hash = '/';
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.hash = '/login';
  };

  const handleEnrollSuccess = (updatedUser: User) => {
      if (!updatedUser) return;
      setUser({ ...updatedUser });
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser)); 
  };

  const navigate = (path: string) => {
    window.location.hash = path.startsWith('#') ? path.slice(1) : path;
  };

  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;

  if (!user) {
    if (normalizedRoute === '/login') {
      return (
        <div className="bg-slate-50 min-h-screen p-4 flex items-center justify-center">
          <Login onLogin={handleLogin} />
        </div>
      );
    }
    return <LandingPage onNavigate={navigate} />;
  }

  let content;

  if (normalizedRoute === '/' || normalizedRoute === '') {
      content = user.role === UserRole.STUDENT ? (
        <BrowseCourses user={user} onNavigate={navigate} onEnrollSuccess={handleEnrollSuccess} />
      ) : (
        <Dashboard user={user} onNavigate={navigate} />
      );
  } else if (normalizedRoute === '/my-courses') {
      content = <MyCourses user={user} onNavigate={navigate} />;
  } else if (normalizedRoute === '/create-course') {
      content = <CourseEditor user={user} onNavigate={navigate} />;
  } else if (normalizedRoute.startsWith('/edit-course/')) {
      content = <CourseEditor user={user} onNavigate={navigate} editCourseId={normalizedRoute.split('/')[2]} />;
  } else if (normalizedRoute.startsWith('/course/')) {
      content = <CoursePlayer user={user} courseId={normalizedRoute.split('/')[2]} onNavigate={navigate} />;
  } else if (normalizedRoute.startsWith('/reset-password')) {
      content = <ResetPassword onNavigate={navigate} />;
  } else if (normalizedRoute === '/admin') {
      content = <AdminPanel user={user} onNavigate={navigate} />;
  } else {
      content = (
        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="text-slate-400 text-6xl font-bold">404</div>
            <p className="text-slate-500">The requested learning path does not exist.</p>
            <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Go Home</button>
        </div>
      );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onNavigate={navigate}>
      {content}
    </Layout>
  );
};

export default App;
