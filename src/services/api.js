const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الخادم');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // المصادقة
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  // المستخدمين
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // الطلاب
  async getStudents() {
    return this.request('/students');
  }

  async createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: studentData,
    });
  }

  async updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: studentData,
    });
  }

  async deleteStudent(id) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // الجلسات
  async getSessions() {
    return this.request('/sessions');
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: sessionData,
    });
  }

  async updateSession(id, sessionData) {
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: sessionData,
    });
  }

  async deleteSession(id) {
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // الحضور
  async recordAttendance(attendanceData) {
    return this.request('/attendance', {
      method: 'POST',
      body: attendanceData,
    });
  }

  // الواتساب
  async initializeWhatsApp() {
    return this.request('/whatsapp/initialize', {
      method: 'POST',
    });
  }

  async getWhatsAppStatus() {
    return this.request('/whatsapp/status');
  }

  async sendSessionReport(sessionId) {
    return this.request('/whatsapp/send-session-report', {
      method: 'POST',
      body: { sessionId },
    });
  }

  // الإحصائيات
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // المواد والمعلمين والأماكن
  async getSubjects() {
    return this.request('/subjects');
  }

  async getTeachers() {
    return this.request('/teachers');
  }

  async getLocations() {
    return this.request('/locations');
  }

  async getClasses() {
    return this.request('/classes');
  }
}

export const apiService = new ApiService();