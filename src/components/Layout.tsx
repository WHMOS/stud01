import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ScanLine,
  GraduationCap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, currentPage, setCurrentPage, hasPermission } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
    { icon: ScanLine, label: 'ماسح الحضور', id: 'attendance-scanner' },
    { icon: Users, label: 'إدارة الطلاب', id: 'students' },
    { icon: BookOpen, label: 'إدارة الفصول', id: 'classes' },
    { icon: GraduationCap, label: 'إدارة المعلمين', id: 'teachers' },
    { icon: Calendar, label: 'إدارة الجلسات', id: 'sessions' },
    { icon: FileText, label: 'التقارير', id: 'reports' },
    { icon: MessageSquare, label: 'إدارة الواتساب', id: 'whatsapp' },
    { icon: Settings, label: 'الإعدادات', id: 'settings' },
    { icon: Users, label: 'إدارة المستخدمين', id: 'users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">نظام إدارة الحضور</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1">
          {menuItems.map((item) => {
            // التحقق من الصلاحيات
            if (item.id === 'users' && !hasPermission('users')) {
              return null;
            }
            if (item.id === 'students' && !hasPermission('students')) {
              return null;
            }
            if (item.id === 'classes' && !hasPermission('classes')) {
              return null;
            }
            if (item.id === 'teachers' && !hasPermission('teachers')) {
              return null;
            }
            if (item.id === 'sessions' && !hasPermission('sessions')) {
              return null;
            }
            if (item.id === 'attendance-scanner' && !hasPermission('attendance')) {
              return null;
            }
            if (item.id === 'reports' && !hasPermission('reports')) {
              return null;
            }
            if (item.id === 'whatsapp' && !hasPermission('whatsapp')) {
              return null;
            }
            if (item.id === 'settings' && !hasPermission('settings')) {
              return null;
            }
            
            return (
              <button
                key={item.id}
                className={`w-full flex items-center px-4 py-3 transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 ml-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <div className="font-medium">{currentUser?.name}</div>
              <div className="text-xs text-gray-500">
                {currentUser?.role === 'admin' ? 'مدير' : 
                 currentUser?.role === 'supervisor' ? 'مشرف' : 'معلم'}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm text-gray-600">
                مرحباً، {currentUser?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};