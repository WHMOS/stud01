import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Settings, Plus, Edit, Trash2, Search, Eye, Shield, User } from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'supervisor' as 'admin' | 'supervisor',
    permissions: {} as any
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState<{ show: boolean, userId: string, userName: string }>({ show: false, userId: '', userName: '' });
  const [userPermissions, setUserPermissions] = useState({
    students: true,
    classes: true,
    teachers: true,
    sessions: true,
    attendance: true,
    reports: true,
    whatsapp: true,
    users: false
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من عدم تكرار اسم المستخدم
    const existingUser = users.find(u => u.username === formData.username && u.id !== editingUser);
    if (existingUser) {
      alert('اسم المستخدم موجود بالفعل');
      return;
    }

    if (editingUser) {
      updateUser(editingUser, formData);
      setEditingUser(null);
    } else {
      addUser(formData);
    }
    setFormData({ username: '', password: '', name: '', role: 'supervisor' });
    setShowAddForm(false);
  };

  const handleManagePermissions = (user: any) => {
    setShowPermissionsModal({ show: true, userId: user.id, userName: user.name });
    const currentPermissions = user.permissions || {
      students: true,
      classes: true,
      teachers: true,
      sessions: true,
      attendance: true,
      reports: true,
      whatsapp: true,
      users: false
    };
    setUserPermissions(currentPermissions);
  };

  const handleSavePermissions = () => {
    console.log('💾 حفظ الصلاحيات:', showPermissionsModal.userId, userPermissions);
    updateUser(showPermissionsModal.userId, { permissions: userPermissions });
    setShowPermissionsModal({ show: false, userId: '', userName: '' });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user.id);
    setFormData({
      username: user.username,
      password: '', // لا نعرض كلمة المرور الحالية
      name: user.name,
      role: user.role
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الخاص');
      return;
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteUser(id);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', name: '', role: 'supervisor' });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'مدير' : 'مشرف';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="h-6 w-6 ml-2" />
          إدارة المستخدمين
        </h1>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للاحتفاظ بالحالية)' : 'كلمة المرور'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
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
                  الدور
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'supervisor' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="supervisor">مشرف</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingUser ? 'حفظ التغييرات' : 'إضافة المستخدم'}
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

      {/* نافذة إدارة الصلاحيات */}
      {showPermissionsModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">إدارة صلاحيات: {showPermissionsModal.userName}</h2>
            <div className="space-y-3">
              {Object.entries({
                students: 'إدارة الطلاب',
                classes: 'إدارة الفصول',
                teachers: 'إدارة المعلمين',
                sessions: 'إدارة الجلسات',
                attendance: 'تسجيل الحضور',
                reports: 'التقارير',
                whatsapp: 'إدارة الواتساب',
                users: 'إدارة المستخدمين'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPermissions[key as keyof typeof userPermissions]}
                      onChange={(e) => setUserPermissions({
                        ...userPermissions,
                        [key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex space-x-4 space-x-reverse mt-6">
              <button
                onClick={handleSavePermissions}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                حفظ الصلاحيات
              </button>
              <button
                onClick={() => setShowPermissionsModal({ show: false, userId: '', userName: '' })}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                إلغاء
              </button>
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
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأدوار</option>
              <option value="admin">مدير</option>
              <option value="supervisor">مشرف</option>
            </select>
          </div>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.id === currentUser?.id && (
                          <div className="text-xs text-blue-600">(أنت)</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      <Shield className="h-3 w-3 ml-1" />
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => {/* عرض تفاصيل المستخدم */}}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleManagePermissions(user)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="إدارة الصلاحيات"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="حذف"
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد مستخدمين مطابقين للبحث</p>
        </div>
      )}
    </div>
  );
};