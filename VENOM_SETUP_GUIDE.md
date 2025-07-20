# دليل تثبيت وإعداد Venom-Bot للواتساب

## 📋 المتطلبات الأساسية

### متطلبات النظام:
- **Node.js**: الإصدار 16 أو أحدث
- **Chrome أو Chromium**: مثبت على النظام
- **اتصال إنترنت مستقر**
- **نظام التشغيل**: Windows, macOS, أو Linux

### التحقق من المتطلبات:
```bash
# التحقق من إصدار Node.js
node --version

# التحقق من إصدار npm
npm --version

# التحقق من وجود Chrome (Linux)
google-chrome --version
# أو
chromium-browser --version
```

## 🚀 خطوات التثبيت

### الخطوة 1: تثبيت venom-bot
```bash
# في مجلد المشروع
npm install venom-bot

# تثبيت المكتبات المساعدة (اختياري)
npm install qrcode-terminal
```

### الخطوة 2: تثبيت Chrome (إذا لم يكن مثبتاً)

#### على Ubuntu/Debian:
```bash
# تحديث قائمة الحزم
sudo apt update

# تثبيت Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install google-chrome-stable

# أو تثبيت Chromium
sudo apt install chromium-browser
```

#### على CentOS/RHEL:
```bash
# تثبيت Chrome
sudo yum install -y wget
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum localinstall google-chrome-stable_current_x86_64.rpm
```

#### على macOS:
```bash
# باستخدام Homebrew
brew install --cask google-chrome
```

### الخطوة 3: إعداد متغيرات البيئة
أنشئ ملف `.env` في جذر المشروع:
```env
# إعدادات الواتساب
WHATSAPP_SESSION_NAME=attendance-system
WHATSAPP_HEADLESS=true
WHATSAPP_DEBUG=false
WHATSAPP_AUTO_CLOSE=60000

# إعدادات Chrome
CHROME_PATH=/usr/bin/google-chrome
# أو للـ Chromium
# CHROME_PATH=/usr/bin/chromium-browser
```

## 🔧 التكوين والإعداد

### الخطوة 1: إنشاء مجلد التوكن
```bash
# إنشاء مجلد لحفظ بيانات الجلسة
mkdir tokens
chmod 755 tokens
```

### الخطوة 2: تحديث package.json
أضف السكريبت التالي إلى `package.json`:
```json
{
  "scripts": {
    "whatsapp:init": "node scripts/init-whatsapp.js"
  }
}
```

### الخطوة 3: إنشاء سكريبت التهيئة
أنشئ ملف `scripts/init-whatsapp.js`:
```javascript
const venom = require('venom-bot');

async function initWhatsApp() {
  try {
    const client = await venom.create(
      'attendance-system',
      (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('QR Code:');
        console.log(asciiQR);
        console.log('Attempts:', attempts);
        console.log('URL Code:', urlCode);
      },
      (statusSession, session) => {
        console.log('Status:', statusSession);
        console.log('Session:', session);
      }
    );
    
    console.log('WhatsApp initialized successfully!');
    
    // اختبار إرسال رسالة
    // await client.sendText('966501234567@c.us', 'مرحباً من نظام إدارة الحضور');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

initWhatsApp();
```

## 📱 خطوات الربط مع الواتساب

### الخطوة 1: تشغيل النظام
```bash
npm run dev
```

### الخطوة 2: تهيئة الواتساب
1. اذهب إلى قسم "إدارة الواتساب" في النظام
2. اضغط على زر "تهيئة الواتساب"
3. ستظهر رسالة "جاري التهيئة..."

### الخطوة 3: مسح QR Code
1. افتح وحدة التحكم (Console) في المتصفح أو Terminal
2. ستجد QR Code مطبوع في النص
3. افتح واتساب على هاتفك
4. اذهب إلى: **الإعدادات** > **الأجهزة المرتبطة** > **ربط جهاز**
5. امسح QR Code الظاهر

### الخطوة 4: التأكد من الاتصال
- ستظهر رسالة "WhatsApp connected successfully!" عند نجاح الاتصال
- ستتغير حالة الاتصال في النظام إلى "متصل" مع أيقونة خضراء

## 🔧 استكشاف الأخطاء وحلها

### مشكلة: QR Code لا يظهر
**الأسباب المحتملة:**
- Chrome غير مثبت أو غير موجود في المسار المحدد
- مشاكل في الصلاحيات

**الحلول:**
```bash
# تحقق من وجود Chrome
which google-chrome
which chromium-browser

# تثبيت Chrome إذا لم يكن موجوداً
sudo apt install google-chrome-stable

# تحديث مسار Chrome في الكود
export CHROME_PATH=/usr/bin/google-chrome
```

### مشكلة: انقطاع الاتصال المتكرر
**الأسباب المحتملة:**
- اتصال إنترنت غير مستقر
- إعدادات الخادم

**الحلول:**
```javascript
// في ملف whatsappService.ts
const client = await venom.create(
  'attendance-system',
  // ... callbacks
  {
    // إعدادات إضافية للاستقرار
    autoClose: 0, // عدم إغلاق الجلسة تلقائياً
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    }
  }
);
```

### مشكلة: فشل إرسال الرسائل
**الأسباب المحتملة:**
- تنسيق رقم الهاتف خاطئ
- الرقم غير مسجل في الواتساب
- تم حظر الحساب

**الحلول:**
```javascript
// تحقق من تنسيق الرقم
function formatPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // للأرقام السعودية
  if (!cleaned.startsWith('966')) {
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5')) {
      cleaned = '966' + cleaned;
    }
  }
  
  return cleaned + '@c.us';
}

// اختبار الرقم قبل الإرسال
async function testNumber(phoneNumber) {
  const isValid = await client.checkNumberStatus(formatPhoneNumber(phoneNumber));
  return isValid.exists;
}
```

### مشكلة: استهلاك ذاكرة عالي
**الحل:**
```javascript
// إعدادات تحسين الأداء
const client = await venom.create(
  'attendance-system',
  // ... callbacks
  {
    puppeteerOptions: {
      args: [
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  }
);
```

## 🔒 الأمان والخصوصية

### حماية ملفات التوكن:
```bash
# تعيين صلاحيات آمنة لمجلد التوكن
chmod 700 tokens/
chmod 600 tokens/*

# إضافة مجلد التوكن إلى .gitignore
echo "tokens/" >> .gitignore
```

### نصائح الأمان:
1. **لا تشارك ملفات التوكن** مع أي شخص
2. **استخدم أرقام هواتف صحيحة فقط**
3. **احترم قوانين الواتساب** لتجنب الحظر
4. **لا ترسل رسائل مزعجة** أو غير مرغوب فيها
5. **راقب معدل الإرسال** لتجنب الحظر المؤقت

### حدود الإرسال الآمنة:
- **الحد الأقصى**: 50 رسالة في الساعة
- **التأخير بين الرسائل**: 2-3 ثواني على الأقل
- **الرسائل المجمعة**: لا تزيد عن 10 رسائل في المرة الواحدة

## 📊 مراقبة الأداء

### إضافة نظام السجلات:
```javascript
// في whatsappService.ts
class WhatsAppLogger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
    
    // حفظ في ملف السجل (اختياري)
    // fs.appendFileSync('whatsapp.log', `${timestamp} - ${level}: ${message}\n`);
  }
  
  static info(message, data) { this.log('INFO', message, data); }
  static error(message, data) { this.log('ERROR', message, data); }
  static warn(message, data) { this.log('WARN', message, data); }
}

// استخدام السجلات
WhatsAppLogger.info('Sending message', { to: phoneNumber, length: message.length });
```

### مراقبة حالة الاتصال:
```javascript
// فحص دوري لحالة الاتصال
setInterval(async () => {
  try {
    const state = await client.getConnectionState();
    WhatsAppLogger.info('Connection state', state);
    
    if (state !== 'CONNECTED') {
      WhatsAppLogger.warn('Connection lost, attempting to reconnect...');
      // إعادة الاتصال
    }
  } catch (error) {
    WhatsAppLogger.error('Error checking connection', error);
  }
}, 30000); // كل 30 ثانية
```

## 🚀 النشر في الإنتاج

### إعداد خادم الإنتاج:
```bash
# تثبيت PM2 لإدارة العمليات
npm install -g pm2

# إنشاء ملف ecosystem.config.js
module.exports = {
  apps: [{
    name: 'attendance-system',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      WHATSAPP_HEADLESS: 'true'
    }
  }]
};

# تشغيل التطبيق
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### إعداد النسخ الاحتياطي:
```bash
# نسخ احتياطي يومي لملفات التوكن
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf "backup/tokens_$DATE.tar.gz" tokens/
find backup/ -name "tokens_*.tar.gz" -mtime +7 -delete
```

## 📞 الدعم الفني

### في حالة مواجهة مشاكل:

1. **تحقق من السجلات:**
   ```bash
   # عرض سجلات النظام
   tail -f whatsapp.log
   
   # عرض سجلات PM2
   pm2 logs attendance-system
   ```

2. **إعادة تشغيل الخدمة:**
   ```bash
   pm2 restart attendance-system
   ```

3. **مسح البيانات وإعادة البدء:**
   ```bash
   # حذف ملفات التوكن (سيتطلب إعادة مسح QR Code)
   rm -rf tokens/
   mkdir tokens
   ```

4. **التحقق من التحديثات:**
   ```bash
   npm update venom-bot
   ```

### موارد إضافية:
- [وثائق venom-bot الرسمية](https://github.com/orkestral/venom)
- [مجتمع venom-bot على Discord](https://discord.gg/venom)
- [أمثلة الاستخدام](https://github.com/orkestral/venom/tree/master/examples)

---

## ⚠️ تنبيهات مهمة

1. **استخدم هذا النظام بمسؤولية** واحترم قوانين الواتساب
2. **لا تستخدمه للرسائل التجارية** بدون موافقة المستقبلين
3. **احتفظ بنسخ احتياطية** من ملفات التوكن
4. **راقب الاستخدام** لتجنب تجاوز الحدود المسموحة
5. **اختبر النظام** في بيئة التطوير قبل النشر

---

**ملاحظة:** هذا الدليل محدث حتى تاريخ إنشائه. قد تحتاج لمراجعة التحديثات الجديدة لمكتبة venom-bot.