import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ScanLine, Check, X, AlertCircle, Users } from 'lucide-react';

export const AttendanceScanner: React.FC = () => {
  const { students, sessions, attendance, recordAttendance, deleteAttendance, classes } = useApp();
  const [selectedSession, setSelectedSession] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState({ show: false, message: '', type: 'success' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'active');
  const currentSessionAttendance = attendance.filter(a => a.sessionId === selectedSession);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !selectedSession) return;

    const student = students.find(s => s.barcode === barcodeInput.trim());
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
    const existingRecord = currentSessionAttendance.find(a => a.studentId === student.id);
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

  const getSessionStudents = () => {
    if (!selectedSession) return [];
    
    const session = sessions.find(s => s.id === selectedSession);
    if (!session) return [];
    
    const sessionClass = session.classId;
    const classStudents = students.filter(s => s.classId === sessionClass);
    
    return classStudents.map(student => {
      const attendanceRecord = currentSessionAttendance.find(a => a.studentId === student.id);
      return {
        ...student,
        attendanceStatus: attendanceRecord?.status || 'absent',
        attendanceId: attendanceRecord?.id
      };
    });
  };

  const sessionStudents = getSessionStudents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ماسح الحضور</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <ScanLine className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-600">
            {sessionStudents.length > 0 && `${sessionStudents.filter(s => s.attendanceStatus === 'present').length}/${sessionStudents.length} حاضر`}
          </span>
        </div>
      </div>

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
                  const sessionClass = classes.find(c => c.id === session.classId);
                  return (
                    <option key={session.id} value={session.id}>
                      {sessionClass?.name} - {new Date(session.startTime).toLocaleTimeString('ar-SA')}
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
            <p className="text-gray-500 text-center py-8">
              اختر جلسة لعرض قائمة الطلاب
            </p>
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
                            onClick={() => handleDeleteAttendance(student.attendanceId!, student.name)}
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