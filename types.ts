
export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin'
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  enrolledCourseIds: string[];
  isSuspended?: boolean;
}

export interface Module {
  _id: string;
  title: string;
  order: number;
  videoUrl: string;
  lessonContent: string;
  transcript: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

export enum CapstoneType {
  PROJECT = 'project',
  FINAL_EXAM = 'final_exam'
}

export interface Capstone {
  _id: string;
  instructions: string;
  type: CapstoneType;
}

export interface LiveSession {
  topic: string;
  date: string;
  meetingLink: string;
  isActive: boolean;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  tutorId: string;
  tutorName: string;
  modules: Module[];
  quizzes: Quiz[];
  capstone?: Capstone;
  createdAt: string;
  published: boolean;
  liveSession?: LiveSession;
  geminiCacheName?: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
}

export interface Progress {
  _id: string;
  userId: string;
  courseId: string;
  completedModuleIds: string[];
  quizResults: QuizResult[];
  capstoneStatus: 'pending' | 'submitted' | 'graded';
  capstoneSubmissionText?: string;
  capstoneGrade?: number;
  capstoneFeedback?: string;
  lastUpdated: string;
}

export interface Notification {
  _id: string;
  userId: string;
  message: string;
  date: string;
  read: boolean;
  fromName: string;
  type: 'info' | 'grade' | 'announcement' | 'live';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
