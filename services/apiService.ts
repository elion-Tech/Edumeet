import { Course, Progress, User, Notification, LiveSession } from '../types';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

const REMOTE_URL = import.meta.env.VITE_API_URL;

const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  // Set 120s timeout for Render cold-starts and slow SMTP operations
  const timeoutId = setTimeout(() => controller.abort(), 120000); 

  try {
    const response = await fetch(`${REMOTE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
    });
    
    clearTimeout(timeoutId);

    if (response.status === 204) return { status: 204, data: {} as T };
    
    const text = await response.text();
    
    if (!text || text.trim() === "" || text === "undefined" || text === "null") {
        return { status: response.status, data: {} as T };
    }

    try {
        const data = JSON.parse(text);
        if (!response.ok) return { status: response.status, error: data.error || data.message || `Request failed with status ${response.status}` };
        return { status: response.status, data: data as T };
    } catch (e) {
        if (!response.ok) return { status: response.status, error: `Server Error: ${response.status}.` };
        return { status: response.status, error: "Invalid response from server." };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') return { status: 408, error: 'Request timed out. The server might be waking up. Please try again in a moment.' };
    return { status: 500, error: 'Connection failed. Please check your internet connection.' };
  }
};

export const api = {
  settings: {
    get: () => ({ mode: 'remote' as const, remoteUrl: REMOTE_URL }),
    checkHealth: async () => {
        try {
            const res = await fetch(`${REMOTE_URL}/health`);
            const data = await res.json();
            return { ok: res.ok && data.status === 'ok', status: data.status === 'ok' ? 'Online' : 'Warning' };
        } catch { return { ok: false, status: 'Initializing' }; }
    }
  },
  courses: {
    getAll: (view?: string) => request<Course[]>(`/api/courses${view ? `?view=${view}` : ''}`),
    getById: (id: string) => request<Course>(`/api/courses/${id}`),
    save: (course: Course) => request<Course>('/api/courses', { method: 'POST', body: JSON.stringify(course) }),
    delete: (id: string) => request<void>(`/api/courses/${id}`, { method: 'DELETE' }),
    // Connects to PATCH /api/courses/:id/publish -> CourseController.togglePublish
    togglePublish: (id: string, published: boolean) => request<void>(`/api/courses/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ published }) }),
    scheduleLive: (courseId: string, session: LiveSession) => request<void>(`/api/courses/${courseId}/live`, { method: 'POST', body: JSON.stringify(session) }),
    getEnrolledStudents: (courseId: string) => request<{user: User, progress: Progress | null}[]>(`/api/courses/${courseId}/students`)
  },
  users: {
    getAll: () => request<User[]>('/api/users'),
    login: (credentials: {email: string, password?: string}) => request<User>('/api/users/login', { method: 'POST', body: JSON.stringify(credentials) }),
    save: (user: User) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(user) }),
    toggleSuspension: (userId: string, isSuspended: boolean) => request<void>(`/api/users/${userId}/suspend`, { method: 'PATCH', body: JSON.stringify({ isSuspended }) }),
    delete: (userId: string) => request<void>(`/api/users/${userId}`, { method: 'DELETE' }),
    enroll: (userId: string, courseId: string) => request<User>(`/api/users/${userId}/enroll`, { method: 'POST', body: JSON.stringify({ courseId }) }),
    requestPasswordReset: (data: { email: string }) => request<void>('/api/users/request-password-reset', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data: { token: string, newPassword: string }) => request<void>('/api/users/reset-password', { method: 'POST', body: JSON.stringify(data) })
  },
  progress: {
    get: (userId: string, courseId: string) => request<Progress>(`/api/progress/${userId}/${courseId}`),
    update: (progress: Progress) => request<Progress>('/api/progress', { method: 'PUT', body: JSON.stringify(progress) }),
    gradeCapstone: (progressId: string, score: number, feedback: string) => request<void>(`/api/progress/${progressId}/grade`, { method: 'PATCH', body: JSON.stringify({ score, feedback }) })
  },
  notifications: {
    getByUser: (userId: string) => request<Notification[]>(`/api/notifications/${userId}`),
    send: (notif: Omit<Notification, '_id' | 'date' | 'read'>) => request<void>('/api/notifications', { method: 'POST', body: JSON.stringify(notif) }),
    markRead: (id: string) => request<void>(`/api/notifications/${id}/read`, { method: 'PATCH' })
  }
};