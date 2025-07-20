export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'supervisor' | 'teacher';
  name: string;
  permissions?: UserPermissions;
  createdAt: Date;
}

export interface UserPermissions {
  students: boolean;
  classes: boolean;
  teachers: boolean;
  sessions: boolean;
  attendance: boolean;
  reports: boolean;
  whatsapp: boolean;
  settings: boolean;
  users: boolean;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  roomNumber?: string;
  capacity?: number;
  description?: string;
  createdAt: Date;
  isActive?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  subjectId: string | null;
  subjectName?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  isActive?: boolean;
}

export interface Student {
  id: string;
  name: string;
  barcode: string;
  parentPhone: string;
  parentEmail?: string;
  classId: string | null;
  className?: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: Date;
  isActive?: boolean;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  teacherName?: string;
  subjectId?: string;
  subjectName?: string;
  maxCapacity: number;
  createdAt: Date;
  isActive?: boolean;
}

export interface Session {
  id: string;
  classId: string;
  isActive?: boolean;
  className?: string;
  teacherName?: string;
  subjectName?: string;
  locationId?: string;
  locationName?: string;
  roomNumber?: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  studentId: string;
  sessionId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: Date;
  notes?: string;
  isAutomatic?: boolean;
  recordedBy?: string;
}

export interface Report {
  id: string;
  studentId: string;
  sessionId: string;
  teacherRating: number;
  quizScore?: number;
  participation: number;
  behavior: string;
  homework: 'completed' | 'incomplete' | 'partial';
  comments?: string;
  strengths?: string;
  areasForImprovement?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  sessionId?: string;
  messageType: 'absence' | 'performance' | 'reminder' | 'announcement' | 'session_report' | 'custom';
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  message: string;
  phoneNumber: string;
  errorMessage?: string;
  retryCount?: number;
  sentBy?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalSessions: number;
  attendanceRate: number;
  lowAttendanceClasses: string[];
  frequentAbsentees: string[];
  todayAbsent: number;
  todayPresent: number;
  recentAlerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  message: string;
  time: string;
  studentId?: string;
  classId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'absence' | 'performance' | 'reminder' | 'announcement' | 'custom';
  template: string;
  variables?: string[];
  isDefault: boolean;
  createdBy?: string;
  createdAt: Date;
}