import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, Send, Settings, Eye, Edit, Trash2, Plus, Users, Wifi, WifiOff } from 'lucide-react';

export const WhatsAppManagement: React.FC = () => {
  const { students, sessions, classes, whatsappLogs, initializeWhatsApp, getWhatsAppStatus, sendWhatsAppMessage } = useApp();
  const [activeTab, setActiveTab] = useState('messages');
  const [messageType, setMessageType] = useState('absence');
  const [selectedSession, setSelectedSession] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(getWhatsAppStatus());

  const messageTemplates = {
    absence: 'عزيزي ولي الأمر، نود إعلامكم بأن الطالب/ة {studentName} كان غائباً في جلسة {className} بتاريخ {date}. نرجو المتابعة.',
    performance: 'عزيزي ولي الأمر، تقرير أداء الطالب/ة {studentName} في جلسة {className}: تقييم المعلم: {rating}/5، المشاركة: {participation}/5، الواجب: {homework}',
    reminder: 'تذكير: لديكم جلسة {className} غداً في تمام الساعة {time}. نتطلع لحضور الطالب/ة {studentName}',
    announcement: 'إعلان مهم: {message}'
  };

  const handleSendMessage = () => {
    if (!selectedSession || !messageTemplate) {
      alert('يرجى اختيار الجلسة وكتابة الرسالة');
      return;
    }

    if (!connectionStatus) {
      alert('يجب تهيئة الواتساب أولاً');
      return;
    }

    const session = sessions.find(s => s.id === selectedSession);
    const sessionClass = classes.find(c => c.id === session?.classId);
    
    // في التطبيق الحقيقي، هنا سيتم إرسال الرسائل عبر WhatsApp API
    alert(`تم إرسال ${messageType === 'absence' ? 'رسائل الغياب' : 'الرسائل'} بنجاح!`);
  };

  const handleInitializeWhatsApp = async () => {
    setIsConnecting(true);
    try {
      const success = await initializeWhatsApp();
      if (success) {
        setConnectionStatus(true);
        alert('تم تهيئة الواتساب بنجاح! يمكنك الآن إرسال الرسائل.');
      } else {
        alert('فشل في تهيئة الواتساب. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تهيئة الواتساب');
    } finally {
      setIsConnecting(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'تم الإرسال';
      case 'delivered': return 'تم التسليم';
      case 'read': return 'تم القراءة';
      case 'failed': return 'فشل الإرسال';
      default: return status;
    }
  };

  const getMessageTypeText = (type: string) => {
    switch (type) {
      case 'absence': return 'غياب';
      case 'performance': return 'أداء';
      case 'reminder': return 'تذكير';
      case 'announcement': return 'إعلان';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="h-6 w-6 ml-2" />
          إدارة الواتساب
        </h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            {connectionStatus ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm ${connectionStatus ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          {!connectionStatus && (
            <button
              onClick={handleInitializeWhatsApp}
              disabled={isConnecting}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50"
            >
              {isConnecting ? 'جاري التهيئة...' : 'تهيئة الواتساب'}
            </button>
          )}
        </div>
      </div>

      {/* التبويبات */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إرسال الرسائل
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              سجل الرسائل
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قوالب الرسائل
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الرسالة
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => {
                      setMessageType(e.target.value);
                      setMessageTemplate(messageTemplates[e.target.value as keyof typeof messageTemplates]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="absence">رسالة غياب</option>
                    <option value="performance">تقرير أداء</option>
                    <option value="reminder">تذكير</option>
                    <option value="announcement">إعلان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الجلسة
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الجلسة</option>
                    {sessions.map(session => {
                      const sessionClass = classes.find(c => c.id === session.classId);
                      return (
                        <option key={session.id} value={session.id}>
                          {sessionClass?.name} - {new Date(session.startTime).toLocaleDateString('ar-SA')}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نص الرسالة
                </label>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اكتب نص الرسالة هنا..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك استخدام المتغيرات: {'{studentName}'}, {'{className}'}, {'{date}'}, {'{time}'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={!connectionStatus}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 ml-2" />
                  إرسال الرسائل
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الرسالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإرسال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* بيانات تجريبية لسجل الرسائل */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">أحمد محمد علي</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">غياب</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          تم التسليم
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date().toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button className="text-blue-600 hover:text-blue-900 p-1" title="عرض">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {whatsappLogs.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد رسائل مرسلة</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">قوالب الرسائل</h3>
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة قالب
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(messageTemplates).map(([type, template]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{getMessageTypeText(type)}</h4>
                      <div className="flex space-x-2 space-x-reverse">
                        <button className="text-green-600 hover:text-green-900 p-1" title="تعديل">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1" title="حذف">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{template}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};