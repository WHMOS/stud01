const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByUsername(username) {
    console.log('🔍 البحث عن المستخدم:', username);
    const query = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
    try {
      const results = await executeQuery(query, [username]);
      console.log('📊 نتائج البحث:', results.length > 0 ? 'موجود' : 'غير موجود');
      if (results.length > 0) {
        console.log('👤 بيانات المستخدم:', {
          id: results[0].id,
          username: results[0].username,
          name: results[0].name,
          role: results[0].role,
          passwordHash: results[0].password ? 'موجود' : 'مفقود'
        });
      }
      return results[0] || null;
    } catch (error) {
      console.error('❌ خطأ في البحث عن المستخدم:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ? AND is_active = TRUE';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async getAll() {
    const query = 'SELECT id, username, name, role, permissions, created_at FROM users WHERE is_active = TRUE ORDER BY created_at DESC';
    return await executeQuery(query);
  }

  static async create(userData) {
    const { username, password, name, role, permissions } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, password, name, role, permissions) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      username, 
      hashedPassword, 
      name, 
      role, 
      JSON.stringify(permissions || {})
    ]);
    
    return result.insertId;
  }

  static async update(id, userData) {
    const { username, password, name, role, permissions } = userData;
    
    console.log('📝 User.update - البيانات الواردة:', userData);
    
    // إذا كان التحديث للصلاحيات فقط
    if (permissions && Object.keys(userData).length === 1) {
      const query = 'UPDATE users SET permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await executeQuery(query, [JSON.stringify(permissions), id]);
      console.log('✅ تم تحديث الصلاحيات، عدد الصفوف المتأثرة:', result.affectedRows);
      return result.affectedRows > 0;
    }
    
    let query = 'UPDATE users SET username = ?, name = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    let params = [username, name, role, JSON.stringify(permissions || {}), id];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username = ?, password = ?, name = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params = [username, hashedPassword, name, role, JSON.stringify(permissions || {}), id];
    }
    
    console.log('📊 معاملات التحديث:', params);
    const result = await executeQuery(query, params);
    console.log('✅ نتيجة التحديث:', result.affectedRows);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const query = 'UPDATE users SET is_active = FALSE WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    console.log('🔐 التحقق من كلمة المرور...');
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('✅ نتيجة التحقق:', isValid ? 'صحيحة' : 'خاطئة');
      return isValid;
    } catch (error) {
      console.error('❌ خطأ في التحقق من كلمة المرور:', error);
      return false;
    }
  }

  static async updatePermissions(id, permissions) {
    const query = 'UPDATE users SET permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [JSON.stringify(permissions), id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;