import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Student, Class, Session, Attendance, Report, WhatsAppLog, DashboardStats, Alert, Teacher, Subject, UserPermissions, Location } from '../types';
import { apiService } from '../services/apiService';

interface AppContextType {
  currentUser: User | null;
  currentPage: string;
  students: Student[];
  classes: Class[];
  sessions: Session[];
  attendance: Attendance[];
  reports: Report[];
  whatsappLogs: WhatsAppLog[];
  users: User[];
  teachers: Teacher[];
  subjects: Subject[];
  locations: Location[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentPage: (page: string) => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  refreshData: () => Promise<void>;
  // Students
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  transferStudentToClass: (studentId: string, newClassId: string | null) => Promise<void>;
  removeStudentFromClass: (studentId: string) => Promise<void>;
  // Classes
  addClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<void>;
  updateClass: (id: string, classData: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  // Teachers
  addTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  // Subjects
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  // Locations
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  // Sessions
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => Promise<void>;
  updateSession: (id: string, session: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  toggleSessionStatus: (id: string) => Promise<void>;
  getSessionStudents: (sessionId: string) => Promise<any[]>;
  // Attendance
  recordAttendance: (attendance: Omit<Attendance, 'id' | 'timestamp'>) => Promise<void>;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  // Reports
  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => Promise<void>;
  updateReport: (id: string, report: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  getPerformanceReport: (filters: any) => Promise<any[]>;
  getAttendanceReport: (filters: any) => Promise<any[]>;
  // Users
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // WhatsApp
  initializeWhatsApp: () => Promise<boolean>;
  getWhatsAppStatus: () => boolean;
  sendSessionReport: (sessionId: string) => Promise<boolean>;
  sendWhatsAppMessage: (phoneNumber: string, message: string) => Promise<boolean>;
  // Utils
  getDashboardStats: () => DashboardStats;
  generateStudentBarcode: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  // حفظ واستعادة جلسة المستخدم
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // حفظ جلسة المستخدم عند تغييرها
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 تحديث البيانات...');
      const [
        studentsRes,
        classesRes,
        sessionsRes,
        attendanceRes,
        reportsRes,
        usersRes,
        teachersRes,
        subjectsRes,
        locationsRes
      ] = await Promise.all([
        apiService.getStudents(),
        apiService.getClasses(),
        apiService.getSessions(),
        apiService.getAttendance(),
        apiService.getReports(),
        currentUser.role === 'admin' ? apiService.getUsers() : Promise.resolve({ data: [] }),
        apiService.getTeachers(),
        apiService.getSubjects(),
        apiService.getLocations()
      ]);

      // معالجة البيانات مع التحقق من صحة البيانات
      const processData = (data: any[], dateFields: string[] = []) => {
        if (!Array.isArray(data)) {
          console.warn('البيانات المستلمة ليست مصفوفة:', data);
          return [];
        }
        
        console.log(`📊 معالجة ${data.length} عنصر`);
        
        return data.map(item => {
          const processed = { ...item };
          
          // معالجة التواريخ
          dateFields.forEach(field => {
            if (processed[field]) {
              try {
                const date = new Date(processed[field]);
                if (!isNaN(date.getTime())) {
                  processed[field] = date;
                } else {
                  console.warn(`تاريخ غير صحيح للحقل ${field}:`, processed[field]);
                  processed[field] = new Date();
                }
              } catch (error) {
                console.error(`خطأ في تحويل التاريخ للحقل ${field}:`, error);
                processed[field] = new Date();
              }
            }
          });
          
          return processed;
        });
      };

      console.log('📥 البيانات المستلمة من الخادم:');
      console.log('- الطلاب:', studentsRes.data?.length || 0);
      console.log('- الفصول:', classesRes.data?.length || 0);
      console.log('- الجلسات:', sessionsRes.data?.length || 0);
      console.log('- الحضور:', attendanceRes.data?.length || 0);
      console.log('- التقارير:', reportsRes.data?.length || 0);
      console.log('- المعلمين:', teachersRes.data?.length || 0);
      console.log('- المواد:', subjectsRes.data?.length || 0);
      console.log('- الأماكن:', locationsRes.data?.length || 0);

      setStudents(processData(studentsRes.data || [], ['createdAt', 'dateOfBirth']));
      setClasses(processData(classesRes.data || [], ['createdAt']));
      setSessions(processData(sessionsRes.data || [], ['createdAt', 'startTime', 'endTime']));
      setAttendance(processData(attendanceRes.data || [], ['timestamp']));
      setReports(processData(reportsRes.data || [], ['createdAt']));
      setUsers(processData(usersRes.data || [], ['createdAt']));
      setTeachers(processData(teachersRes.data || [], ['createdAt']));
      setSubjects(processData(subjectsRes.data || [], ['createdAt']));
      setLocations(processData(locationsRes.data || [], ['createdAt']));
      
      console.log('✅ تم تحديث البيانات بنجاح');
      console.log('📊 البيانات المحفوظة في الحالة:');
      console.log('- الجلسات المحفوظة:', sessionsRes.data?.length || 0);
    } catch (error) {
      console.error('❌ خطأ في تحديث البيانات:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 محاولة تسجيل الدخول...', { username });
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(username, password);
      console.log('📡 استجابة الخادم:', response);
      
      if (response.success && response.data) {
        console.log('✅ تم تسجيل الدخول بنجاح');
        setCurrentUser(response.data);
        return true;
      }
      
      console.log('❌ فشل تسجيل الدخول:', response.message);
      setError(response.message || 'فشل في تسجيل الدخول');
      return false;
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      setError(error.message || 'حدث خطأ في تسجيل الدخول');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setStudents([]);
    setClasses([]);
    setSessions([]);
    setAttendance([]);
    setReports([]);
    setUsers([]);
    setTeachers([]);
    setSubjects([]);
    setLocations([]);
    setWhatsappLogs([]);
    localStorage.removeItem('currentUser');
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.[permission] || false;
  };

  // Students
  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createStudent(studentData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    try {
      const response = await apiService.updateStudent(id, studentData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await apiService.deleteStudent(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  const transferStudentToClass = async (studentId: string, newClassId: string | null) => {
    try {
      const response = await apiService.transferStudent(studentId, newClassId);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error transferring student:', error);
      throw error;
    }
  };

  const removeStudentFromClass = async (studentId: string) => {
    try {
      const response = await apiService.transferStudent(studentId, null);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error removing student from class:', error);
      throw error;
    }
  };

  // Classes
  const addClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createClass(classData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    try {
      const response = await apiService.updateClass(id, classData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const response = await apiService.deleteClass(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  };

  // Teachers
  const addTeacher = async (teacher: Omit<Teacher, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createTeacher(teacher);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  };

  const updateTeacher = async (id: string, teacher: Partial<Teacher>) => {
    try {
      const response = await apiService.updateTeacher(id, teacher);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const response = await apiService.deleteTeacher(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  };

  // Subjects
  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createSubject(subject);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      throw error;
    }
  };

  const updateSubject = async (id: string, subject: Partial<Subject>) => {
    try {
      const response = await apiService.updateSubject(id, subject);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const response = await apiService.deleteSubject(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  };

  // Locations
  const addLocation = async (location: Omit<Location, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createLocation(location);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  };

  const updateLocation = async (id: string, location: Partial<Location>) => {
    try {
      const response = await apiService.updateLocation(id, location);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const response = await apiService.deleteLocation(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  };

  // Sessions
  const addSession = async (session: Omit<Session, 'id' | 'createdAt'>) => {
    try {
      console.log('📝 إضافة جلسة جديدة:', session);
      
      const sessionData = {
        classId: session.classId,
        locationId: session.locationId,
        startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
        endTime: session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime,
        status: session.status || 'scheduled',
        notes: session.notes || null
      };
      
      console.log('📤 بيانات الجلسة المرسلة للخادم:', sessionData);
      
      const response = await apiService.createSession(sessionData);
      if (response.success) {
        console.log('✅ تم إضافة الجلسة بنجاح');
        await refreshData();
      } else {
        console.error('❌ فشل في إضافة الجلسة:', response.message);
        throw new Error(response.message || 'فشل في إضافة الجلسة');
      }
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  };

  const updateSession = async (id: string, session: Partial<Session>) => {
    try {
      console.log('✏️ تحديث الجلسة:', id, session);
      
      const sessionData = {
        classId: session.classId,
        locationId: session.locationId,
        startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
        endTime: session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime,
        status: session.status,
        notes: session.notes
      };
      
      // إزالة الحقول غير المحددة
      Object.keys(sessionData).forEach(key => {
        if (sessionData[key] === undefined) {
          delete sessionData[key];
        }
      });
      
      console.log('📤 بيانات الجلسة المرسلة للتحديث:', sessionData);
      
      const response = await apiService.updateSession(id, sessionData);
      if (response.success) {
        console.log('✅ تم تحديث الجلسة بنجاح');
        await refreshData();
      } else {
        console.error('❌ فشل في تحديث الجلسة:', response.message);
        throw new Error(response.message || 'فشل في تحديث الجلسة');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const response = await apiService.deleteSession(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  const toggleSessionStatus = async (id: string) => {
    try {
      console.log('🔄 تغيير حالة الجلسة:', id);
      const response = await apiService.toggleSessionStatus(id);
      console.log('📡 استجابة تغيير الحالة:', response);
      if (response.success) {
        console.log('✅ تم تغيير حالة الجلسة بنجاح');
        await refreshData();
      } else {
        console.error('❌ فشل في تغيير حالة الجلسة:', response.message);
        throw new Error(response.message || 'فشل في تغيير حالة الجلسة');
      }
    } catch (error) {
      console.error('Error toggling session status:', error);
      throw error;
    }
  };

  const getSessionStudents = async (sessionId: string) => {
    try {
      console.log('👥 جلب طلاب الجلسة:', sessionId);
      const response = await apiService.getSessionStudents(sessionId);
      console.log('📡 استجابة طلاب الجلسة:', response);
      return response.data || [];
    } catch (error) {
      console.error('Error getting session students:', error);
      return [];
    }
  };

  // Attendance
  const recordAttendance = async (attendanceData: Omit<Attendance, 'id' | 'timestamp'>) => {
    try {
      const response = await apiService.recordAttendance(attendanceData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  };

  const updateAttendance = async (id: string, attendanceData: Partial<Attendance>) => {
    try {
      const response = await apiService.updateAttendance(id, attendanceData);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const response = await apiService.deleteAttendance(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  };

  // Reports
  const addReport = async (report: Omit<Report, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createReport(report);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  };

  const updateReport = async (id: string, report: Partial<Report>) => {
    try {
      const response = await apiService.updateReport(id, report);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const response = await apiService.deleteReport(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  const getPerformanceReport = async (filters: any) => {
    try {
      const response = await apiService.getPerformanceReport(filters);
      return response.data || [];
    } catch (error) {
      console.error('Error getting performance report:', error);
      return [];
    }
  };

  const getAttendanceReport = async (filters: any) => {
    try {
      const response = await apiService.getAttendanceReport(filters);
      return response.data || [];
    } catch (error) {
      console.error('Error getting attendance report:', error);
      return [];
    }
  };

  // Users
  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createUser(user);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    try {
      const response = await apiService.updateUser(id, user);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await apiService.deleteUser(id);
      if (response.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // WhatsApp
  const initializeWhatsApp = async (): Promise<boolean> => {
    try {
      const response = await apiService.initializeWhatsApp();
      if (response.success) {
        setWhatsappConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      return false;
    }
  };

  const getWhatsAppStatus = (): boolean => {
    return whatsappConnected;
  };

  const sendSessionReport = async (sessionId: string): Promise<boolean> => {
    try {
      const response = await apiService.sendSessionReport(sessionId);
      return response.success;
    } catch (error) {
      console.error('Error sending session report:', error);
      return false;
    }
  };

  const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
    try {
      // في التطبيق الحقيقي، سيتم استدعاء API للواتساب
      console.log('Sending WhatsApp message:', { phoneNumber, message });
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  };

  const generateStudentBarcode = async (): Promise<string> => {
    try {
      const response = await apiService.generateBarcode();
      return response.data?.barcode || 'STUD000001';
    } catch (error) {
      console.error('Error generating barcode:', error);
      return 'STUD000001';
    }
  };

  const getDashboardStats = (): DashboardStats => {
    const totalStudents = students.length;
    const totalSessions = sessions.length;
    
    const todayAttendance = attendance.filter(record => {
      const today = new Date();
      const recordDate = new Date(record.timestamp);
      return recordDate.toDateString() === today.toDateString();
    });

    const presentToday = todayAttendance.filter(record => record.status === 'present').length;
    const absentToday = todayAttendance.filter(record => record.status === 'absent').length;
    const attendanceRate = todayAttendance.length > 0 ? (presentToday / todayAttendance.length) * 100 : 0;

    const lowAttendanceClasses = classes.filter(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const classAttendance = todayAttendance.filter(a => {
        const student = students.find(s => s.id === a.studentId);
        return student && student.classId === cls.id;
      });
      const classPresent = classAttendance.filter(a => a.status === 'present').length;
      const classRate = classStudents.length > 0 ? (classPresent / classStudents.length) * 100 : 0;
      return classRate < 70;
    }).map(cls => cls.name);

    const frequentAbsentees = students.filter(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const recentAttendance = studentAttendance.filter(a => {
        const recordDate = new Date(a.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      });
      const absentCount = recentAttendance.filter(a => a.status === 'absent').length;
      return absentCount >= 3;
    }).map(student => student.name);

    const recentAlerts: Alert[] = [];
    
    lowAttendanceClasses.forEach(className => {
      recentAlerts.push({
        id: `alert-${Date.now()}-${className}`,
        type: 'warning',
        message: `${className} - معدل الحضور أقل من 70% اليوم`,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
    });
    
    frequentAbsentees.slice(0, 3).forEach(studentName => {
      recentAlerts.push({
        id: `alert-${Date.now()}-${studentName}`,
        type: 'danger',
        message: `${studentName} - غائب لثلاثة أيام متتالية`,
        time: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
    });

    return {
      totalStudents,
      totalSessions,
      attendanceRate,
      lowAttendanceClasses,
      frequentAbsentees,
      todayAbsent: absentToday,
      todayPresent: presentToday,
      recentAlerts: recentAlerts.slice(0, 5)
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentPage,
        students,
        classes,
        sessions,
        attendance,
        reports,
        whatsappLogs,
        users,
        teachers,
        subjects,
        locations,
        loading,
        error,
        login,
        logout,
        setCurrentPage,
        hasPermission,
        refreshData,
        addStudent,
        updateStudent,
        deleteStudent,
        transferStudentToClass,
        removeStudentFromClass,
        addClass,
        updateClass,
        deleteClass,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        addLocation,
        updateLocation,
        deleteLocation,
        addSession,
        updateSession,
        deleteSession,
        toggleSessionStatus,
        getSessionStudents,
        recordAttendance,
        updateAttendance,
        deleteAttendance,
        addReport,
        updateReport,
        deleteReport,
        getPerformanceReport,
        getAttendanceReport,
        addUser,
        updateUser,
        deleteUser,
        initializeWhatsApp,
        getWhatsAppStatus,
        sendSessionReport,
        sendWhatsAppMessage,
        getDashboardStats,
        generateStudentBarcode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};