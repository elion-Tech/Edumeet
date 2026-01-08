
import { User, UserRole } from '../types';
import { api } from './apiService';

export const SESSION_KEY = 'edumeet_user_session';

export const login = async (email: string, password?: string): Promise<User> => {
  if (!password) throw new Error("Password required.");
  
  const res = await api.users.login({ email, password });
  
  if (res.error) throw new Error(res.error);
  if (!res.data) throw new Error("Authentication failed.");
  
  const user = res.data;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const signup = async (name: string, email: string, password: string, phoneNumber: string, role: UserRole): Promise<User> => {
  const newUser: User = {
    _id: `u_${Date.now()}`,
    name,
    email,
    phoneNumber,
    password, 
    role,
    createdAt: new Date().toISOString(),
    enrolledCourseIds: [],
    isSuspended: false
  };

  const res = await api.users.save(newUser);
  if (res.error) throw new Error(res.error);
  
  const finalUser = res.data!;
  localStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));
  return finalUser;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const res = await api.users.requestPasswordReset({ email });
  if (res.error) throw new Error(res.error || 'Failed to request password reset.');
  // The backend would handle sending the email.
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const res = await api.users.resetPassword({ token, newPassword });
  if (res.error) throw new Error(res.error || 'Failed to reset password.');
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(SESSION_KEY);
  window.location.hash = '';
};

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }
    const user = JSON.parse(stored);
    if (!user || typeof user !== 'object' || !user._id) return null;
    return user;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const enterDemoMode = async (role: UserRole): Promise<User> => {
    const demoEmail = `${role}@edumeet.demo`;
    
    // Attempt login with demo credentials
    const loginRes = await api.users.login({ email: demoEmail, password: 'demo' });
    
    if (loginRes.data) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(loginRes.data));
        return loginRes.data;
    }

    // If login fails, create the demo account (provisioning)
    const user: User = {
        _id: `u_demo_${role}`,
        name: `Demo ${role.toUpperCase()}`,
        email: demoEmail,
        password: 'demo',
        role: role,
        createdAt: new Date().toISOString(),
        enrolledCourseIds: [],
        isSuspended: false
    };

    const saveRes = await api.users.save(user);
    if (saveRes.error) throw new Error(saveRes.error);
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(saveRes.data!));
    return saveRes.data!;
};
