import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Settings, Plus, Edit, Trash2, Search, MapPin, BookOpen, Users } from 'lucide-react';

export const SettingsManagement: React.FC = () => {
  const { locations, subjects, addLocation, updateLocation, deleteLocation, addSubject, updateSubject, deleteSubject } = useApp();
  const [activeTab, setActiveTab] = useState('locations');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    roomNumber: '',
    capacity: 30,
    description: ''
  });

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.roomNumber && location.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeTab === 'locations') {
        if (editingItem) {
          await updateLocation(editingItem, formData);
        } else {
          await addLocation(formData);
        }
      } else {
        if (editingItem) {
          await updateSubject(editingItem, { name: formData.name, description: formData.description });
        } else {
          await addSubject({ name: formData.name, description: formData.description });
        }
      }
      
      resetForm();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item.id);
    if (activeTab === 'locations') {
      setFormData({
        name: item.name,
        roomNumber: item.roomNumber || '',
        capacity: item.capacity || 30,
        description: item.description || ''
      });
    } else {
      setFormData({
        name: item.name,
        roomNumber: '',
        capacity: 30,
        description: item.description || ''
      });
    }
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    // التحقق من الارتباطات قبل الحذف
    if (activeTab === 'subjects') {
      const subjectTeachers = teachers.filter(t => t.subjectId === id);
      if (subjectTeachers.length > 0) {
        alert(`لا يمكن حذف المادة لأنها مرتبطة بـ ${subjectTeachers.length} معلم. يرجى إزالة المادة من المعلمين أولاً.`);
        return;
      }
    }
    
    if (activeTab === 'locations') {
      const locationSessions = sessions.filter(s => s.locationId === id);
      if (locationSessions.length > 0) {
        alert(`لا يمكن حذف المكان لأنه مستخدم في ${locationSessions.length} جلسة.`);
        return;
      }
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      try {
        if (activeTab === 'locations') {
          await deleteLocation(id);
        } else {
          await deleteSubject(id);
        }
      } catch (error: any) {
        alert(error.message || 'حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', roomNumber: '', capacity: 30, description: '' });
    setEditingItem(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="h-6 w-6 ml-2" />
          الإعدادات
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          {activeTab === 'locations' ? 'إضافة مكان' : 'إضافة مادة'}
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem 
                ? (activeTab === 'locations' ? 'تعديل المكان' : 'تعديل المادة')
                : (activeTab === 'locations' ? 'إضافة مكان جديد' : 'إضافة مادة جديدة')
              }
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'locations' ? 'اسم المكان' : 'اسم المادة'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {activeTab === 'locations' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم القاعة
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: A101"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعة
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف اختياري..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingItem ? 'حفظ التغييرات' : (activeTab === 'locations' ? 'إضافة المكان' : 'إضافة المادة')}
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

      {/* التبويبات */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => {
                setActiveTab('locations');
                setSearchTerm('');
                resetForm();
              }}
              className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-4 w-4 ml-2" />
              أماكن الحصص
            </button>
            <button
              onClick={() => {
                setActiveTab('subjects');
                setSearchTerm('');
                resetForm();
              }}
              className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-4 w-4 ml-2" />
              المواد الدراسية
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* البحث */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`البحث عن ${activeTab === 'locations' ? 'مكان' : 'مادة'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* عرض البيانات */}
          {activeTab === 'locations' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <div key={location.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 ml-2 text-blue-600" />
                      {location.name}
                    </h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {location.roomNumber && (
                      <div>
                        <span className="font-medium">رقم القاعة:</span> {location.roomNumber}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">السعة:</span> {location.capacity || 30} طالب
                    </div>
                    {location.description && (
                      <div>
                        <span className="font-medium">الوصف:</span> {location.description}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">تاريخ الإضافة:</span> {location.createdAt ? new Date(location.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <div key={subject.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BookOpen className="h-5 w-5 ml-2 text-green-600" />
                      {subject.name}
                    </h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {subject.description && (
                      <div>
                        <span className="font-medium">الوصف:</span> {subject.description}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">تاريخ الإضافة:</span> {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* رسالة عدم وجود بيانات */}
          {((activeTab === 'locations' && filteredLocations.length === 0) || 
            (activeTab === 'subjects' && filteredSubjects.length === 0)) && (
            <div className="text-center py-12">
              {activeTab === 'locations' ? (
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              ) : (
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-gray-500">
                لا توجد {activeTab === 'locations' ? 'أماكن' : 'مواد'} مطابقة للبحث
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};