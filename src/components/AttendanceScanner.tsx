import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ScanLine, Check, X, AlertCircle, Users, Plus } from 'lucide-react';

export const AttendanceScanner: React.FC = () => {
  const { students, sessions, attendance, recordAttendance, deleteAttendance, classes, locations, addSession, getSessionStudents } = useApp();
  const [selectedSession, setSelectedSession] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState({ show: false, message: '', type: 'success' });
  const [showQuickAddSession, setShowQuickAddSession] = useState(false);
  const [sessionStudents, setSessionStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [quickSessionData, setQuickSessionData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'active' as const
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // جلب طلاب الجلسة عند تغيير الجلسة المختارة
  useEffect(() => {
    const loadSessionStudents = async () => {
      if (!selectedSession) {
        setSessionStudents([]);
        return;
      }
      
      setLoadingStudents(true);
      try {
        console.log('🔄 جلب طلاب الجلسة:', selectedSession);
        const students = await getSessionStudents(selectedSession);
        console.log('👥 طلاب الجلسة المجلبة:', students);
        setSessionStudents(students);
      } catch (error) {
        console.error('❌ خطأ في جلب طلاب الجلسة:', error);
        setSessionStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    
    loadSessionStudents();
  }, [selectedSession, getSessionStudents]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'active');

  // تحديث قائمة الجلسات لعرض الأسماء بشكل صحيح
  const getSessionDisplayName = (session: any) => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const location = locations.find(l => l.id === session.locationId);
    const startTime = new Date(session.startTime);
    
    if (isNaN(startTime.getTime())) {
      return `${sessionClass?.name || 'فصل غير محدد'} - وقت غير صحيح`;
    }
    
    const timeStr = startTime.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const dateStr = startTime.toLocaleDateString('ar-SA');
    
    return `${sessionClass?.name || 'فصل غير محدد'} - ${timeStr} - ${dateStr}${location ? ` - ${location.name}` : ''}`;
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !selectedSession) return;

    const student = sessionStudents.find(s => s.barcode === barcodeInput.trim());
    if (!student) {
      showAlertMessage('الطالب غير موجود', 'error');
      setBarcodeInput('');
      return;
    }

    // التحقق من انتماء الطالب للفصل
    const session = sessions.find(s => s.id === selectedSession);
    if (session && student.classId !== session.classId) {
      showAlertMessage('هذا الطالب لا ينتمي لفصل هذه الجلسة', 'error');
      setBarcodeInput('');
      return;
    }

    // التحقق من التسجيل المسبق
    const existingRecord = sessionStudents.find(s => s.id === student.id && s.attendanceStatus === 'present');
    if (existingRecord) {
      showAlertMessage('تم تسجيل الطالب مسبقاً', 'warning');
      setBarcodeInput('');
      return;
    }

    // تسجيل الحضور
    recordAttendance({
      studentId: student.id,
      sessionId: selectedSession,
      status: 'present'
    });

    setLastScannedStudent(student.id);
    showAlertMessage(`تم تسجيل حضور ${student.name}`, 'success');
    setBarcodeInput('');
    
    // تأثير بصري
    document.body.style.backgroundColor = '#10B981';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 200);
    
    // تحديث قائمة الطلاب
    setSessionStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, attendanceStatus: 'present' } : s
    ));
  };

  const handleDeleteAttendance = (attendanceId: string, studentName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف تسجيل حضور ${studentName}؟`)) {
      deleteAttendance(attendanceId);
      showAlertMessage(`تم حذف تسجيل حضور ${studentName}`, 'success');
    }
  };

  const showAlertMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setShowAlert({ show: true, message, type });
    setTimeout(() => setShowAlert({ show: false, message: '', type: 'success' }), 3000);
  };


  const handleQuickAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSession({
        ...quickSessionData,
        startTime: new Date(quickSessionData.startTime),
        endTime: new Date(quickSessionData.endTime)
      });
      setQuickSessionData({
        classId: '',
        locationId: '',
        startTime: '',
        endTime: '',
        status: 'active'
      });
      setShowQuickAddSession(false);
      showAlertMessage('تم إضافة الجلسة بنجاح', 'success');
    } catch (error) {
      showAlertMessage('حدث خطأ أثناء إضافة الجلسة', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ماسح الحضور</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => setShowQuickAddSession(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center text-sm"
          >
            <Plus className="h-4 w-4 ml-1" />
            إضافة جلسة سريعة
          </button>
          <ScanLine className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-600">
            {sessionStudents.length > 0 && `${sessionStudents.filter(s => s.attendanceStatus === 'present').length}/${sessionStudents.length} حاضر`}
          </span>
        </div>
      </div>

      {/* نافذة إضافة جلسة سريعة */}
      {showQuickAddSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">إضافة جلسة سريعة</h2>
            <form onSubmit={handleQuickAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفصل *
                </label>
                <select
                  value={quickSessionData.classId}
                  onChange={(e) => setQuickSessionData({ ...quickSessionData, classId: e.target.value })}
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
                  المكان
                </label>
                <select
                  value={quickSessionData.locationId}
                  onChange={(e) => setQuickSessionData({ ...quickSessionData, locationId: e.target.value })}
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت البداية *
                  </label>
                  <input
                    type="datetime-local"
                    value={quickSessionData.startTime}
                    onChange={(e) => setQuickSessionData({ ...quickSessionData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت النهاية *
                  </label>
                  <input
                    type="datetime-local"
                    value={quickSessionData.endTime}
                    onChange={(e) => setQuickSessionData({ ...quickSessionData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  إضافة الجلسة
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddSession(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تنبيهات */}
      {showAlert.show && (
        <div className={`p-4 rounded-lg border-r-4 ${
          showAlert.type === 'success' ? 'bg-green-50 border-green-400' :
          showAlert.type === 'error' ? 'bg-red-50 border-red-400' :
          'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex items-center">
            {showAlert.type === 'success' ? (
              <Check className="h-5 w-5 text-green-600 ml-2" />
            ) : showAlert.type === 'error' ? (
              <X className="h-5 w-5 text-red-600 ml-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 ml-2" />
            )}
            <span className="text-sm font-medium">{showAlert.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ماسح الباركود */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">تسجيل الحضور</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر الجلسة
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر جلسة...</option>
                {activeSessions.map(session => {
                  return (
                    <option key={session.id} value={session.id}>
                      {getSessionDisplayName(session)}
                    </option>
                  );
                })}
              </select>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كود الطالب
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="امسح الباركود أو أدخل الكود"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  disabled={!selectedSession}
                />
              </div>
              <button
                type="submit"
                disabled={!selectedSession || !barcodeInput.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                تسجيل الحضور
              </button>
            </form>
          </div>
        </div>

        {/* قائمة الطلاب */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 ml-2" />
            قائمة الطلاب
          </h2>
          
          {sessionStudents.length === 0 ? (
            loadingStudents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">جاري تحميل الطلاب...</p>
              </div>
            ) : selectedSession ? (
              <p className="text-gray-500 text-center py-8">
                لا يوجد طلاب في هذه الجلسة
              </p>
            ) : (
              <p className="text-gray-500 text-center py-8">
                اختر جلسة لعرض قائمة الطلاب
              </p>
            )
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessionStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    student.attendanceStatus === 'present'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 opacity-70'
                  } ${
                    lastScannedStudent === student.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ml-3 ${
                        student.attendanceStatus === 'present' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.attendanceStatus === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.attendanceStatus === 'present' ? 'حاضر' : 'غائب'}
                      </span>
                      {student.attendanceStatus === 'present' && (
                        <div className="flex space-x-1 space-x-reverse">
                          <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                            تعديل
                          </button>
                          <button 
                            onClick={() => handleDeleteAttendance(student.attendanceId || student.id, student.name)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};