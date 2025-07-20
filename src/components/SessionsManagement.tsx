import React, { useState } from 'react';
import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, Clock, Play, Square, CheckCircle, Star, MessageSquare, X, ToggleLeft, ToggleRight } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, students, addSession, updateSession, deleteSession, toggleSessionStatus, attendance, addReport, reports, teachers, subjects, locations, getWhatsAppStatus, getSessionStudents } = useApp();
  
  // إضافة تسجيل للتحقق من البيانات
  React.useEffect(() => {
    console.log('🔍 SessionsManagement - البيانات المتاحة:');
    console.log('- الجلسات:', sessions.length);
    console.log('- الفصول:', classes.length);
    console.log('- الطلاب:', students.length);
    console.log('- المعلمين:', teachers.length);
    console.log('- المواد:', subjects.length);
    console.log('- الأماكن:', locations.length);
    
    if (sessions.length > 0) {
      console.log('📋 عينة من الجلسات:', sessions.slice(0, 3));
    }
  }, [sessions, classes, students, teachers, subjects, locations]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [sessionDetailsStudents, setSessionDetailsStudents] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState<{ show: boolean, studentId: string, studentName: string, sessionId: string }>({ show: false, studentId: '', studentName: '', sessionId: '' });
  const [reportData, setReportData] = useState({
    teacherRating: 5,
    quizScore: 0,
    participation: 5,
    behavior: 'ممتاز',
    homework: 'completed' as 'completed' | 'incomplete',
    comments: ''
  });
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled'
  });

  // جلب طلاب الجلسة عند فتح تفاصيل الجلسة
  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!showSessionDetails) {
        setSessionDetailsStudents([]);
        return;
      }
      
      try {
        console.log('🔄 جلب تفاصيل الجلسة:', showSessionDetails);
        const students = await getSessionStudents(showSessionDetails);
        console.log('👥 طلاب الجلسة المجلبة:', students);
        setSessionDetailsStudents(students);
      } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل الجلسة:', error);
        setSessionDetailsStudents([]);
      }
    };
    
    loadSessionDetails();
  }, [showSessionDetails, getSessionStudents]);

  const connectionStatus = getWhatsAppStatus();

  const filteredSessions = sessions.filter(session => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const matchesSearch = searchTerm === '' || sessionClass?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || session.status === statusFilter;
    
    console.log('🔍 فلترة الجلسة:', {
      sessionId: session.id,
      className: sessionClass?.name,
      searchTerm,
      statusFilter,
      matchesSearch,
      matchesStatus,
      finalResult: matchesSearch && matchesStatus
    });
    
    return matchesSearch && matchesStatus;
  });

  // إضافة تسجيل للجلسات المفلترة
  React.useEffect(() => {
    console.log('📊 نتائج الفلترة:');
    console.log('- إجمالي الجلسات:', sessions.length);
    console.log('- الجلسات المفلترة:', filteredSessions.length);
    console.log('- مصطلح البحث:', searchTerm);
    console.log('- فلتر الحالة:', statusFilter);
  }, [sessions.length, filteredSessions.length, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 إرسال بيانات الجلسة:', formData);
    const sessionData = {
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime)
    };

    if (editingSession) {
      console.log('✏️ تحديث الجلسة:', editingSession, sessionData);
      updateSession(editingSession, sessionData);
      setEditingSession(null);
    } else {
      console.log('➕ إضافة جلسة جديدة:', sessionData);
      addSession(sessionData);
    }
    setFormData({ classId: '', locationId: '', startTime: '', endTime: '', status: 'scheduled' });
    setShowAddForm(false);
  };

  const handleEdit = (session: any) => {
    console.log('✏️ تعديل الجلسة:', session);
    setEditingSession(session.id);
    setFormData({
      classId: session.classId,
      locationId: session.locationId || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      status: session.status
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    console.log('🗑️ محاولة حذف الجلسة:', id);
    const sessionAttendance = attendance.filter(a => a.sessionId === id);
    if (sessionAttendance.length > 0) {
      alert(`لا يمكن حذف الجلسة لأنها تحتوي على ${sessionAttendance.length} سجل حضور`);
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
      console.log('✅ تأكيد حذف الجلسة:', id);
      deleteSession(id);
    }
  };

  const resetForm = () => {
    setFormData({ classId: '', locationId: '', startTime: '', endTime: '', status: 'scheduled' });
    setEditingSession(null);
    setShowAddForm(false);
  };

  const handleAddReport = (studentId: string, studentName: string, sessionId: string) => {
    const existingReport = reports.find(r => r.studentId === studentId && r.sessionId === sessionId);
    if (existingReport) {
      setReportData({
        teacherRating: existingReport.teacherRating,
        quizScore: existingReport.quizScore || 0,
        participation: existingReport.participation,
        behavior: existingReport.behavior,
        homework: existingReport.homework,
        comments: existingReport.comments || ''
      });
    } else {
      setReportData({
        teacherRating: 5,
        quizScore: 0,
        participation: 5,
        behavior: 'ممتاز',
        homework: 'completed',
        comments: ''
      });
    }
    setShowReportModal({ show: true, studentId, studentName, sessionId });
  };

  const handleSubmitReport = () => {
    addReport({
      studentId: showReportModal.studentId,
      sessionId: showReportModal.sessionId,
      ...reportData
    });
    setShowReportModal({ show: false, studentId: '', studentName: '', sessionId: '' });
    setReportData({
      teacherRating: 5,
      quizScore: 0,
      participation: 5,
      behavior: 'ممتاز',
      homework: 'completed',
      comments: ''
    });
  };

  const handleSendSessionReport = async (sessionId: string) => {
    if (!connectionStatus) {
      alert('يجب تهيئة الواتساب أولاً');
      return;
    }

    if (window.confirm('هل أنت متأكد من إرسال تقرير الجلسة كاملاً؟ سيتم إرسال رسائل للطلاب الحاضرين والغائبين.')) {
      try {
        // في التطبيق الحقيقي، سيتم استدعاء API
        // const result = await apiService.sendSessionReport(sessionId);
        
        // محاكاة الإرسال
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('تم إرسال تقرير الجلسة بنجاح!');
        setShowSessionDetails(null);
      } catch (error: any) {
        alert('حدث خطأ أثناء إرسال التقرير: ' + error.message);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const getSessionDisplayName = (session: any) => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
    const subject = subjects.find(s => s.id === teacher?.subjectId);
    
    const teacherName = teacher?.name || 'غير محدد';
    const className = sessionClass?.name || 'غير محدد';
    
    let time = 'وقت غير صحيح';
    let date = 'تاريخ غير صحيح';
    
    try {
      const startTime = new Date(session.startTime);
      if (!isNaN(startTime.getTime())) {
        time = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        date = startTime.toLocaleDateString('en-GB');
      }
    } catch (error) {
      console.error('خطأ في تحويل التاريخ:', error);
    }
    
    return `${teacherName} - ${className} - ${time} - ${date}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 ml-2" />
          إدارة الجلسات
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة جلسة
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفصل
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر الفصل</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مكان الحصة
                </label>
                <select
                  value={formData.locationId || ''}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المكان</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.roomNumber && `- ${location.roomNumber}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مكان الحصة
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المكان</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.roomNumber && `- ${location.roomNumber}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وقت البداية
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وقت النهاية
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingSession ? 'حفظ التغييرات' : 'إضافة الجلسة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الجلسة */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const session = sessions.find(s => s.id === showSessionDetails);
              const sessionClass = classes.find(c => c.id === session?.classId);
              const sessionStudents = getSessionStudents(showSessionDetails);
              const presentStudents = sessionStudents.filter(s => s.attendanceStatus === 'present');
              const absentStudents = sessionStudents.filter(s => s.attendanceStatus === 'absent');
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل جلسة {sessionClass?.name}</h2>
                    <button
                      onClick={() => setShowSessionDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">وقت الجلسة</h3>
                      <p className="text-blue-700">
                        {session?.startTime ? new Date(session.startTime).toLocaleString('en-GB', {
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false
                        }) : ''}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">الحضور</h3>
                      <p className="text-green-700">
                        {sessionDetailsStudents.filter(s => s.attendanceStatus === 'present').length}/{sessionDetailsStudents.length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">التقارير المكتملة</h3>
                      <p className="text-purple-700">
                        {sessionDetailsStudents.filter(s => s.hasReport).length}/{sessionDetailsStudents.filter(s => s.attendanceStatus === 'present').length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">إجراءات الجلسة</h3>
                    <button
                      onClick={() => handleSendSessionReport(showSessionDetails)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 ml-2" />
                      إرسال تقرير الجلسة كاملاً
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* الطلاب الحاضرون */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-green-600">
                        الطلاب الحاضرون ({sessionDetailsStudents.filter(s => s.attendanceStatus === 'present').length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sessionDetailsStudents.filter(s => s.attendanceStatus === 'present').map((student) => (
                          <div key={student.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {student.hasReport && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    تم التقييم
                                  </span>
                                )}
                                <button
                                  onClick={() => handleAddReport(student.id, student.name, showSessionDetails)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <Star className="h-3 w-3 ml-1" />
                                  {student.hasReport ? 'تعديل التقييم' : 'إضافة تقييم'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* الطلاب الغائبون */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-red-600">
                        الطلاب الغائبون ({sessionDetailsStudents.filter(s => s.attendanceStatus === 'absent').length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sessionDetailsStudents.filter(s => s.attendanceStatus === 'absent').map((student) => (
                          <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* نافذة إضافة التقييم */}
      {showReportModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">تقييم الطالب: {showReportModal.studentName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تقييم المعلم (1-5)
                </label>
                <select
                  value={reportData.teacherRating}
                  onChange={(e) => setReportData({ ...reportData, teacherRating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>ممتاز (5)</option>
                  <option value={4}>جيد جداً (4)</option>
                  <option value={3}>جيد (3)</option>
                  <option value={2}>مقبول (2)</option>
                  <option value={1}>ضعيف (1)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  درجة الكويز (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportData.quizScore}
                  onChange={(e) => setReportData({ ...reportData, quizScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="من 100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المشاركة (1-5)
                </label>
                <select
                  value={reportData.participation}
                  onChange={(e) => setReportData({ ...reportData, participation: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>ممتاز (5)</option>
                  <option value={4}>جيد جداً (4)</option>
                  <option value={3}>جيد (3)</option>
                  <option value={2}>مقبول (2)</option>
                  <option value={1}>ضعيف (1)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السلوك
                </label>
                <select
                  value={reportData.behavior}
                  onChange={(e) => setReportData({ ...reportData, behavior: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="يحتاج تحسين">يحتاج تحسين</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الواجب
                </label>
                <select
                  value={reportData.homework}
                  onChange={(e) => setReportData({ ...reportData, homework: e.target.value as 'completed' | 'incomplete' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">مكتمل</option>
                  <option value="incomplete">غير مكتمل</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعليقات إضافية
                </label>
                <textarea
                  value={reportData.comments}
                  onChange={(e) => setReportData({ ...reportData, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  حفظ التقييم
                </button>
                <button
                  onClick={() => setShowReportModal({ show: false, studentId: '', studentName: '', sessionId: '' })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن جلسة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
      </div>

      {/* قائمة الجلسات */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفصل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت البداية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت النهاية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحضور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => {
                const sessionClass = classes.find(c => c.id === session.classId);
                const sessionAttendance = attendance.filter(a => a.sessionId === session.id);
                const presentCount = sessionAttendance.filter(a => a.status === 'present').length;
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sessionClass?.name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          try {
                            const startTime = new Date(session.startTime);
                            if (!isNaN(startTime.getTime())) {
                              return startTime.toLocaleString('en-GB', {
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              });
                            }
                            return 'تاريخ غير صحيح';
                          } catch (error) {
                            return 'تاريخ غير صحيح';
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          try {
                            const endTime = new Date(session.endTime);
                            if (!isNaN(endTime.getTime())) {
                              return endTime.toLocaleString('en-GB', {
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              });
                            }
                            return 'تاريخ غير صحيح';
                          } catch (error) {
                            return 'تاريخ غير صحيح';
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        <span className="mr-1">{getStatusText(session.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {presentCount}/{sessionAttendance.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={async () => {
                            try {
                              console.log('🔄 تغيير حالة الجلسة:', session.id);
                              await toggleSessionStatus(session.id);
                              console.log('✅ تم تغيير حالة الجلسة بنجاح');
                            } catch (error) {
                              console.error('❌ خطأ في تغيير حالة الجلسة:', error);
                              alert('حدث خطأ أثناء تغيير حالة الجلسة');
                            }
                          }}
                          className={`p-1 rounded ${
                            session.status === 'active' 
                              ? 'text-green-600 hover:text-green-900' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title={session.status === 'active' ? 'تحويل إلى مكتملة' : 'تحويل إلى نشطة'}
                        >
                          {session.status === 'active' ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => setShowSessionDetails(session.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(session)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد جلسات مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
};
