import React from 'react';
import { useApp } from '../contexts/AppContext';
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { students, classes, sessions, attendance, getDashboardStats } = useApp();

  const stats = getDashboardStats();

  const statsCards = [
    {
      title: 'إجمالي الطلاب',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'إجمالي الفصول',
      value: classes.length,
      icon: BookOpen,
      color: 'bg-green-500',
      change: '+3%'
    },
    {
      title: 'الجلسات اليوم',
      value: sessions.filter(s => s.status === 'active').length,
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'نسبة الحضور',
      value: `${stats.attendanceRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+2.5%'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <div className="text-sm text-gray-500">
          آخر تحديث: {new Date().toLocaleString('en-GB', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })}
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-sm text-green-600 mt-1">{card.change}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* التنبيهات */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 ml-2 text-yellow-500" />
            التنبيهات الحديثة
          </h2>
          <div className="space-y-3">
            {stats.recentAlerts.length > 0 ? stats.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-r-4 ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : alert.type === 'info'
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-4 w-4 ml-1" />
                    {alert.time}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>لا توجد تنبيهات جديدة</p>
              </div>
            )}
          </div>
        </div>

        {/* الحضور اليوم */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الحضور اليوم</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                <span className="font-medium text-green-800">الحضور</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.todayPresent}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 ml-2" />
                <span className="font-medium text-red-800">الغياب</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.todayAbsent}</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">نسبة الحضور</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.attendanceRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* الفصول النشطة */}
    </div>
  );
};