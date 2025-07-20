import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { BookOpen, Plus, Edit, Trash2, Search, Eye, Users, X, ArrowRight, Printer } from 'lucide-react';

export const ClassesManagement: React.FC = () => {
  const { classes, students, teachers, subjects, addClass, updateClass, deleteClass, removeStudentFromClass, transferStudentToClass } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [showClassDetails, setShowClassDetails] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<{ show: boolean, studentId: string, studentName: string }>({ show: false, studentId: '', studentName: '' });
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    maxCapacity: 30
  });

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateClass(editingClass, formData);
      setEditingClass(null);
    } else {
      addClass(formData);
    }
    setFormData({ name: '', teacherId: '', maxCapacity: 30 });
    setShowAddForm(false);
  };

  const handleEdit = (cls: any) => {
    setEditingClass(cls.id);
    setFormData({
      name: cls.name,
      teacherId: cls.teacherId,
      maxCapacity: cls.maxCapacity
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    const classStudents = students.filter(s => s.classId === id);
    const classSessions = sessions.filter(s => s.classId === id);
    
    if (classStudents.length > 0) {
      alert(`لا يمكن حذف الفصل لأنه يحتوي على ${classStudents.length} طالب`);
      return;
    }
    
    if (classSessions.length > 0) {
      if (!window.confirm(`هذا الفصل لديه ${classSessions.length} جلسة. هل أنت متأكد من الحذف؟ سيتم حذف جميع الجلسات أيضاً.`)) {
        return;
      }
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
      deleteClass(id);
    }
  };

  const handleRemoveStudentFromClass = (studentId: string) => {
    if (window.confirm('هل أنت متأكد من إزالة هذا الطالب من الفصل؟')) {
      removeStudentFromClass(studentId);
    }
  };

  const handleRemoveAllStudentsFromClass = (classId: string) => {
    const classStudents = students.filter(s => s.classId === classId);
    if (window.confirm(`هل أنت متأكد من إزالة جميع الطلاب (${classStudents.length}) من هذا الفصل؟`)) {
      classStudents.forEach(student => {
        removeStudentFromClass(student.id);
      });
      setShowClassDetails(null);
    }
  };

  const handleTransferStudent = (studentId: string, studentName: string) => {
    setShowTransferModal({ show: true, studentId, studentName });
  };

  const confirmTransferStudent = () => {
    if (selectedTargetClass) {
      transferStudentToClass(showTransferModal.studentId, selectedTargetClass);
    } else {
      transferStudentToClass(showTransferModal.studentId, null);
    }
    setShowTransferModal({ show: false, studentId: '', studentName: '' });
    setSelectedTargetClass('');
  };

  const generateClassBarcodes = (classId: string) => {
    const classStudents = students.filter(s => s.classId === classId);
    const className = classes.find(c => c.id === classId)?.name;
    
    if (classStudents.length === 0) {
      alert('لا يوجد طلاب في هذا الفصل');
      return;
    }

    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>باركودات ${className}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .barcode-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
          .barcode-item { border: 2px solid #000; padding: 15px; text-align: center; page-break-inside: avoid; }
          .student-name { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .barcode-svg { margin: 10px 0; }
          .class-name { font-size: 12px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1 style="text-align: center; margin-bottom: 30px;">باركودات فصل ${className}</h1>
        <div class="barcode-container">
          ${classStudents.map(student => `
            <div class="barcode-item">
              <div class="student-name">${student.name}</div>
              <svg class="barcode-svg" id="barcode-${student.id}"></svg>
              <div class="class-name">${className}</div>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = function() {
            ${classStudents.map(student => `
              JsBarcode("#barcode-${student.id}", "${student.barcode}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true
              });
            `).join('')}
            setTimeout(() => window.print(), 1000);
          };
        </script>
      </body>
      </html>
    `;

    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', teacherId: '', maxCapacity: 30 });
    setEditingClass(null);
    setShowAddForm(false);
  };

  const getTeacherDisplayName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return 'غير محدد';
    
    const subjectName = teacher.subjectName || 'غير محدد';
    
    return `${teacher.name}${subjectName !== 'غير محدد' ? ` - ${subjectName}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-6 w-6 ml-2" />
          إدارة الفصول
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة فصل
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingClass ? 'تعديل الفصل' : 'إضافة فصل جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الفصل
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المعلم المسؤول
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{getTeacherDisplayName(teacher.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعة القصوى
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingClass ? 'حفظ التغييرات' : 'إضافة الفصل'}
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

      {/* نافذة تفاصيل الفصل */}
      {showClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const classData = classes.find(c => c.id === showClassDetails);
              const classStudents = students.filter(s => s.classId === showClassDetails);
              const teacherDisplayName = classData?.teacherId ? getTeacherDisplayName(classData.teacherId) : 'غير محدد';
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل فصل {classData?.name}</h2>
                    <button
                      onClick={() => setShowClassDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">المعلم المسؤول</h3>
                      <p className="text-blue-700">{teacherDisplayName}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">عدد الطلاب</h3>
                      <p className="text-green-700">{classStudents.length}/{classData?.maxCapacity}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">نسبة الامتلاء</h3>
                      <p className="text-purple-700">
                        {classData ? ((classStudents.length / classData.maxCapacity) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">قائمة الطلاب ({classStudents.length})</h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => generateClassBarcodes(showClassDetails)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        طباعة الباركودات
                      </button>
                      {classStudents.length > 0 && (
                        <button
                          onClick={() => handleRemoveAllStudentsFromClass(showClassDetails)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          إزالة جميع الطلاب
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {classStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">هاتف ولي الأمر</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {classStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.barcode}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.parentPhone}</td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => handleTransferStudent(student.id, student.name)}
                                    className="text-blue-600 hover:text-blue-900 text-xs bg-blue-100 px-2 py-1 rounded"
                                  >
                                    نقل
                                  </button>
                                  <button
                                    onClick={() => handleRemoveStudentFromClass(student.id)}
                                    className="text-red-600 hover:text-red-900 text-xs bg-red-100 px-2 py-1 rounded"
                                  >
                                    إزالة
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>لا يوجد طلاب في هذا الفصل</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* نافذة نقل الطالب */}
      {showTransferModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">نقل الطالب: {showTransferModal.studentName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر الفصل الجديد
                </label>
                <select
                  value={selectedTargetClass}
                  onChange={(e) => setSelectedTargetClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">بدون فصل</option>
                  {classes.filter(c => c.id !== showClassDetails).map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={confirmTransferStudent}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  نقل
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal({ show: false, studentId: '', studentName: '' });
                    setSelectedTargetClass('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* البحث */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث عن فصل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* قائمة الفصول */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => {
          const classStudents = students.filter(s => s.classId === cls.id);
          const teacherDisplayName = cls.teacherId ? getTeacherDisplayName(cls.teacherId) : 'غير محدد';
          
          return (
            <div key={cls.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setShowClassDetails(cls.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(cls)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 ml-2" />
                  <span>عدد الطلاب: {classStudents.length}/{cls.maxCapacity}</span>
                </div>
                <div>
                  <span>المعلم: {cls.teacherName || 'غير محدد'}</span>
                </div>
                <div>
                  <span>تاريخ الإنشاء: {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cls.maxCapacity > 0 ? (classStudents.length / cls.maxCapacity) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {cls.maxCapacity > 0 ? ((classStudents.length / cls.maxCapacity) * 100).toFixed(1) : 0}% ممتلئ
                </p>
              </div>
              
              <div className="mt-4 flex space-x-2 space-x-reverse">
                <button
                  onClick={() => generateClassBarcodes(cls.id)}
                  className="flex-1 bg-green-100 text-green-800 py-1 px-2 rounded text-xs hover:bg-green-200 transition-colors"
                  disabled={classStudents.length === 0}
                >
                  <Printer className="h-3 w-3 inline ml-1" />
                  طباعة الباركودات
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد فصول مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
};