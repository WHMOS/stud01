# دليل تثبيت وإعداد Venom-Bot للواتساب

## 1. تثبيت venom-bot

```bash
npm install venom-bot
```

## 2. إنشاء ملف خدمة الواتساب

قم بإنشاء ملف `src/services/whatsappService.ts`:

```typescript
import venom from 'venom-bot';

class WhatsAppService {
  private client: any = null;
  private isConnected = false;

  async initialize() {
    try {
      this.client = await venom.create(
        'attendance-system', // اسم الجلسة
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log('QR Code:', asciiQR);
          // يمكنك عرض QR Code في واجهة المستخدم
        },
        (statusSession, session) => {
          console.log('Status Session:', statusSession);
          console.log('Session name:', session);
        },
        {
          folderNameToken: 'tokens', // مجلد حفظ التوكن
          mkdirFolderToken: '',
          headless: true, // تشغيل بدون واجهة
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
            '--disable-gpu'
          ],
          autoClose: 60000,
          createPathFileToken: true,
        }
      );
      
      this.isConnected = true;
      console.log('WhatsApp connected successfully!');
      return true;
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
      return false;
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp not connected');
    }

    try {
      // تنسيق رقم الهاتف (إضافة كود الدولة إذا لم يكن موجوداً)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const result = await this.client.sendText(formattedNumber, message);
      console.log('Message sent successfully:', result);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // إزالة الأحرف غير الرقمية
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // إضافة كود السعودية إذا لم يكن موجوداً
    if (!cleaned.startsWith('966')) {
      if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
      } else {
        cleaned = '966' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('WhatsApp disconnected');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const whatsappService = new WhatsAppService();
```

## 3. تحديث AppContext لدعم الواتساب

```typescript
// في src/contexts/AppContext.tsx
import { whatsappService } from '../services/whatsappService';

// إضافة هذه الدوال في AppContext
const initializeWhatsApp = async () => {
  try {
    const success = await whatsappService.initialize();
    if (success) {
      console.log('WhatsApp initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error);
  }
};

const sendWhatsAppMessage = async (studentId: string, sessionId: string, messageType: string, customMessage?: string): Promise<boolean> => {
  try {
    const student = students.find(s => s.id === studentId);
    const session = sessions.find(s => s.id === sessionId);
    const sessionClass = classes.find(c => c.id === session?.classId);
    
    if (!student || !session || !sessionClass) {
      throw new Error('بيانات غير صحيحة');
    }

    let message = customMessage;
    if (!message) {
      // استخدام القوالب الافتراضية
      switch (messageType) {
        case 'absence':
          message = `عزيزي ولي الأمر، نود إعلامكم بأن الطالب/ة ${student.name} كان غائباً في جلسة ${sessionClass.name} بتاريخ ${new Date(session.startTime).toLocaleDateString('ar-SA')}. نرجو المتابعة.`;
          break;
        case 'performance':
          const report = reports.find(r => r.studentId === studentId && r.sessionId === sessionId);
          if (report) {
            message = `عزيزي ولي الأمر، تقرير أداء الطالب/ة ${student.name} في جلسة ${sessionClass.name}:\nتقييم المعلم: ${report.teacherRating}/5\nالمشاركة: ${report.participation}/5\nالواجب: ${report.homework === 'completed' ? 'مكتمل' : 'غير مكتمل'}\nالتعليقات: ${report.comments || 'لا توجد'}`;
          }
          break;
        default:
          message = `رسالة من نظام إدارة الحضور`;
      }
    }

    const result = await whatsappService.sendMessage(student.parentPhone, message);
    
    // تسجيل الرسالة في السجل
    const newLog: WhatsAppLog = {
      id: Date.now().toString(),
      studentId,
      sessionId,
      messageType: messageType as any,
      status: result.success ? 'sent' : 'failed',
      sentAt: new Date(),
      message: message || ''
    };
    
    setWhatsappLogs([...whatsappLogs, newLog]);
    
    return result.success;
  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    return false;
  }
};
```

## 4. إعداد البيئة

### متطلبات النظام:
- Node.js 14 أو أحدث
- Chrome أو Chromium مثبت
- اتصال إنترنت مستقر

### متغيرات البيئة (.env):
```env
WHATSAPP_SESSION_NAME=attendance-system
WHATSAPP_HEADLESS=true
WHATSAPP_DEBUG=false
```

## 5. خطوات التشغيل

### الخطوة 1: تشغيل النظام
```bash
npm run dev
```

### الخطوة 2: تهيئة الواتساب
1. افتح النظام في المتصفح
2. اذهب إلى قسم "إدارة الواتساب"
3. اضغط على "تهيئة الواتساب"
4. سيظهر QR Code في وحدة التحكم (Console)

### الخطوة 3: مسح QR Code
1. افتح واتساب على هاتفك
2. اذهب إلى الإعدادات > الأجهزة المرتبطة
3. امسح QR Code الظاهر في وحدة التحكم

### الخطوة 4: التأكد من الاتصال
- ستظهر رسالة "WhatsApp connected successfully!" عند نجاح الاتصال
- يمكنك الآن إرسال الرسائل

## 6. استخدام النظام

### إرسال رسائل الغياب:
1. اذهب إلى "إدارة الجلسات"
2. اختر الجلسة المطلوبة
3. اضغط على "إرسال رسائل الغياب"

### إرسال تقارير الأداء:
1. في "إدارة الجلسات"، اضغط على "تفاصيل الجلسة"
2. أضف التقييمات للطلاب الحاضرين
3. اضغط على "إرسال تقارير الأداء"

## 7. استكشاف الأخطاء

### مشكلة: QR Code لا يظهر
**الحل:**
```bash
# تأكد من تثبيت Chrome
sudo apt-get install google-chrome-stable

# أو استخدم Chromium
sudo apt-get install chromium-browser
```

### مشكلة: انقطاع الاتصال
**الحل:**
- تأكد من استقرار الإنترنت
- أعد تشغيل النظام
- امسح مجلد `tokens` وأعد المسح

### مشكلة: فشل إرسال الرسائل
**الحل:**
- تحقق من صحة أرقام الهواتف
- تأكد من أن الواتساب متصل
- تحقق من حالة الاتصال في النظام

## 8. نصائح مهمة

1. **احتفظ بنسخة احتياطية من مجلد `tokens`** - يحتوي على بيانات الجلسة
2. **لا تغلق المتصفح أثناء الاستخدام** - قد يؤدي لانقطاع الاتصال
3. **استخدم أرقام هواتف صحيحة** - تأكد من تنسيق الأرقام
4. **راقب سجل الرسائل** - لمتابعة حالة الإرسال
5. **اختبر النظام أولاً** - أرسل رسائل تجريبية قبل الاستخدام الفعلي

## 9. الأمان والخصوصية

- لا تشارك ملفات التوكن مع أحد
- استخدم أرقام هواتف صحيحة فقط
- احترم قوانين الواتساب لتجنب الحظر
- لا ترسل رسائل مزعجة أو غير مرغوب فيها

## 10. الدعم الفني

في حالة مواجهة مشاكل:
1. تحقق من سجل الأخطاء في وحدة التحكم
2. تأكد من تحديث جميع المكتبات
3. راجع وثائق venom-bot الرسمية
4. تواصل مع فريق الدعم الفني