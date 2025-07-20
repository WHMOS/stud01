const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 بدء تشغيل خادم نظام إدارة الحضور...');
console.log('📍 المنفذ:', PORT);
console.log('🌍 البيئة:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إضافة middleware للتسجيل
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api', apiRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error('❌ خطأ في الخادم:', err);
  res.status(500).json({ 
    success: false, 
    message: 'خطأ داخلي في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// معالجة المسارات غير الموجودة
app.use('/api/*', (req, res) => {
  console.log('❌ مسار API غير موجود:', req.path);
  res.status(404).json({ 
    success: false, 
    message: 'المسار غير موجود',
    path: req.path
  });
});

// تقديم تطبيق React للمسارات الأخرى
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// بدء الخادم
async function startServer() {
  try {
    console.log('🔍 فحص الاتصال بقاعدة البيانات...');
    // اختبار الاتصال بقاعدة البيانات
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ فشل الاتصال بقاعدة البيانات.');
      console.log('📋 تحقق من الخطوات التالية:');
      console.log('   1. تشغيل MySQL في XAMPP');
      console.log('   2. إنشاء قاعدة البيانات attendance_system');
      console.log('   3. التحقق من إعدادات .env');
      console.log('⚠️  الخادم سيعمل بدون قاعدة البيانات (للاختبار فقط)');
    }
    
    app.listen(PORT, () => {
      console.log('\n🎉 تم تشغيل الخادم بنجاح!');
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`📱 يمكنك الوصول للنظام على: http://localhost:${PORT}`);
      console.log(`🔗 API متاح على: http://localhost:${PORT}/api`);
      console.log(`🌐 الواجهة الأمامية: http://localhost:5173`);
      console.log('\n📋 للاختبار:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: admin123');
    });
  } catch (error) {
    console.error('❌ خطأ في بدء الخادم:', error);
    process.exit(1);
  }
}

startServer();

// معالجة الإغلاق الآمن
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف الخادم...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف الخادم...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ خطأ غير معالج:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise مرفوض غير معالج:', reason);
});