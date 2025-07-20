// خدمة الواتساب باستخدام venom-bot
// ملاحظة: هذا الملف يحتاج إلى تثبيت venom-bot أولاً

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private client: any = null;
  private isConnected = false;
  private isInitializing = false;

  async initialize(): Promise<boolean> {
    if (this.isInitializing) {
      console.log('WhatsApp is already initializing...');
      return false;
    }

    if (this.isConnected) {
      console.log('WhatsApp is already connected');
      return true;
    }

    this.isInitializing = true;

    try {
      // تحقق من وجود venom-bot
      const venom = await import('venom-bot').catch(() => null);
      
      if (!venom) {
        console.error('venom-bot is not installed. Please install it first.');
        this.isInitializing = false;
        return false;
      }

      console.log('Initializing WhatsApp connection...');
      
      this.client = await venom.create(
        'attendance-system', // اسم الجلسة
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log('QR Code received. Scan it with your phone:');
          console.log(asciiQR);
          
          // يمكنك عرض QR Code في واجهة المستخدم هنا
          // أو حفظه كصورة
        },
        (statusSession, session) => {
          console.log('Status Session:', statusSession);
          console.log('Session name:', session);
          
          if (statusSession === 'isLogged') {
            this.isConnected = true;
            console.log('WhatsApp connected successfully!');
          }
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
      this.isInitializing = false;
      console.log('WhatsApp initialized successfully!');
      return true;
      
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      this.isInitializing = false;
      this.isConnected = false;
      return false;
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    if (!this.isConnected || !this.client) {
      return {
        success: false,
        error: 'WhatsApp not connected. Please initialize first.'
      };
    }

    try {
      // تنسيق رقم الهاتف
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      console.log(`Sending message to ${formattedNumber}: ${message}`);
      
      const result = await this.client.sendText(formattedNumber, message);
      
      console.log('Message sent successfully:', result);
      
      return {
        success: true,
        messageId: result.id
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    const results: WhatsAppResponse[] = [];
    
    for (const msg of messages) {
      const result = await this.sendMessage(msg.phoneNumber, msg.message);
      results.push(result);
      
      // انتظار قصير بين الرسائل لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // إزالة الأحرف غير الرقمية
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // إضافة كود السعودية إذا لم يكن موجوداً
    if (!cleaned.startsWith('966')) {
      if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
      } else if (cleaned.startsWith('5')) {
        cleaned = '966' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        console.log('WhatsApp disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async getQRCode(): Promise<string | null> {
    // إرجاع QR Code إذا كان متاحاً
    // هذه الوظيفة تحتاج تطوير إضافي حسب احتياجاتك
    return null;
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
export const whatsappService = new WhatsAppService();

// دوال مساعدة للاستخدام في المكونات
export const initializeWhatsApp = () => whatsappService.initialize();
export const sendWhatsAppMessage = (phoneNumber: string, message: string) => 
  whatsappService.sendMessage(phoneNumber, message);
export const getWhatsAppStatus = () => whatsappService.getConnectionStatus();
export const disconnectWhatsApp = () => whatsappService.disconnect();