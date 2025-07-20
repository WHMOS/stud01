const venom = require('venom-bot');
const { executeQuery } = require('../config/database');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.qrCode = null;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('WhatsApp is already initializing...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected) {
      console.log('WhatsApp is already connected');
      return { success: true, message: 'الواتساب متصل بالفعل' };
    }

    this.isInitializing = true;

    try {
      console.log('بدء تهيئة الواتساب...');
      
      this.client = await venom.create(
        'attendance-system',
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log('تم استلام QR Code - المحاولة:', attempts);
          console.log(asciiQR);
          this.qrCode = base64Qr;
          
          // يمكن إرسال QR Code للواجهة الأمامية هنا
          if (this.onQRCode) {
            this.onQRCode(base64Qr, attempts);
          }
        },
        (statusSession, session) => {
          console.log('حالة الجلسة:', statusSession);
          console.log('اسم الجلسة:', session);
          
          if (statusSession === 'isLogged') {
            this.isConnected = true;
            this.isInitializing = false;
            console.log('✅ تم الاتصال بالواتساب بنجاح!');
            
            if (this.onConnected) {
              this.onConnected();
            }
          }
        },
        {
          folderNameToken: 'tokens',
          mkdirFolderToken: '',
          headless: true,
          devtools: false,
          useChrome: true,
          debug: false,
          logQR: true,
          browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security'
          ],
          autoClose: 0,
          createPathFileToken: true,
        }
      );
      
      // انتظار حتى يتم الاتصال أو انتهاء المهلة الزمنية
      const timeout = 60000; // 60 ثانية
      const startTime = Date.now();
      
      while (!this.isConnected && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (this.isConnected) {
        console.log('✅ تم تهيئة الواتساب بنجاح!');
        return { success: true, message: 'تم تهيئة الواتساب بنجاح!' };
      } else {
        this.isInitializing = false;
        return { success: false, message: 'انتهت المهلة الزمنية للاتصال. يرجى المحاولة مرة أخرى.' };
      }
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب:', error);
      this.isInitializing = false;
      this.isConnected = false;
      return { 
        success: false, 
        message: `خطأ في تهيئة الواتساب: ${error.message}` 
      };
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.client) {
      throw new Error('الواتساب غير متصل. يرجى التهيئة أولاً.');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`إرسال رسالة إلى ${formattedNumber}: ${message}`);
      
      const result = await this.client.sendText(formattedNumber, message);
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      throw error;
    }
  }

  async sendSessionReport(sessionId) {
    try {
      // الحصول على بيانات الجلسة
      const sessionQuery = `
        SELECT s.*, c.name as class_name, t.name as teacher_name, 
               sub.name as subject_name, l.name as location_name
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN subjects sub ON c.subject_id = sub.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE s.id = ?
      `;
      
      const sessionResults = await executeQuery(sessionQuery, [sessionId]);
      if (sessionResults.length === 0) {
        throw new Error('الجلسة غير موجودة');
      }
      
      const session = sessionResults[0];
      
      // الحصول على طلاب الفصل مع حالة الحضور والتقارير
      const studentsQuery = `
        SELECT s.id, s.name, s.parent_phone, 
               a.status as attendance_status,
               r.teacher_rating, r.quiz_score, r.participation, 
               r.behavior, r.homework, r.comments
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        LEFT JOIN reports r ON s.id = r.student_id AND r.session_id = ?
        WHERE s.class_id = ? AND s.is_active = TRUE
        ORDER BY s.name
      `;
      
      const students = await executeQuery(studentsQuery, [sessionId, sessionId, session.class_id]);
      
      const results = [];
      const sessionDate = new Date(session.start_time).toLocaleDateString('ar-SA');
      const sessionTime = new Date(session.start_time).toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      for (const student of students) {
        let message = '';
        let messageType = '';
        
        if (!student.attendance_status || student.attendance_status === 'absent') {
          // رسالة غياب
          message = `عزيزي ولي الأمر،\n\nنود إعلامكم بأن الطالب/ة ${student.name} كان غائباً في جلسة ${session.subject_name} - ${session.class_name}\n\nالمعلم: ${session.teacher_name}\nالتاريخ: ${sessionDate}\nالوقت: ${sessionTime}\nالمكان: ${session.location_name}\n\nنرجو المتابعة.\n\nنظام إدارة الحضور`;
          messageType = 'absence';
        } else if (student.attendance_status === 'present' && student.teacher_rating) {
          // تقرير أداء
          message = `عزيزي ولي الأمر،\n\nتقرير أداء الطالب/ة ${student.name}\n\nالجلسة: ${session.subject_name} - ${session.class_name}\nالمعلم: ${session.teacher_name}\nالتاريخ: ${sessionDate}\n\n📊 التقييم:\n• تقييم المعلم: ${student.teacher_rating}/5\n• المشاركة: ${student.participation}/5\n• السلوك: ${student.behavior}\n• الواجب: ${student.homework === 'completed' ? 'مكتمل ✅' : 'غير مكتمل ❌'}`;
          
          if (student.quiz_score) {
            message += `\n• درجة الاختبار: ${student.quiz_score}`;
          }
          
          if (student.comments) {
            message += `\n\n💬 تعليقات المعلم:\n${student.comments}`;
          }
          
          message += `\n\nنظام إدارة الحضور`;
          messageType = 'performance';
        } else if (student.attendance_status === 'present') {
          // رسالة حضور بدون تقرير
          message = `عزيزي ولي الأمر،\n\nنود إعلامكم بحضور الطالب/ة ${student.name} في جلسة ${session.subject_name} - ${session.class_name}\n\nالمعلم: ${session.teacher_name}\nالتاريخ: ${sessionDate}\nالوقت: ${sessionTime}\n\nنظام إدارة الحضور`;
          messageType = 'attendance';
        } else {
          continue; // تخطي الطلاب المتأخرين أو المعذورين
        }
        
        try {
          const result = await this.sendMessage(student.parent_phone, message);
          
          // تسجيل الرسالة في قاعدة البيانات
          await executeQuery(
            'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status) VALUES (?, ?, ?, ?, ?, ?)',
            [student.id, sessionId, messageType, message, student.parent_phone, 'sent']
          );
          
          results.push({
            studentId: student.id,
            studentName: student.name,
            success: true,
            messageId: result.messageId,
            messageType
          });
          
          // انتظار قصير بين الرسائل
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`خطأ في إرسال رسالة للطالب ${student.name}:`, error);
          
          // تسجيل الخطأ في قاعدة البيانات
          await executeQuery(
            'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student.id, sessionId, messageType, message, student.parent_phone, 'failed', error.message]
          );
          
          results.push({
            studentId: student.id,
            studentName: student.name,
            success: false,
            error: error.message,
            messageType
          });
        }
      }
      
      return {
        success: true,
        totalStudents: students.length,
        sentMessages: results.filter(r => r.success).length,
        failedMessages: results.filter(r => !r.success).length,
        results
      };
      
    } catch (error) {
      console.error('خطأ في إرسال تقرير الجلسة:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (!cleaned.startsWith('966')) {
      if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
      } else if (cleaned.startsWith('5')) {
        cleaned = '966' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        console.log('تم قطع الاتصال بالواتساب');
      } catch (error) {
        console.error('خطأ في قطع الاتصال:', error);
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getQRCode() {
    return this.qrCode;
  }

  // دوال للاستماع للأحداث
  onQRCode(callback) {
    this.onQRCode = callback;
  }

  onConnected(callback) {
    this.onConnected = callback;
  }
}

// إنشاء instance واحد
const whatsappService = new WhatsAppService();

module.exports = whatsappService;