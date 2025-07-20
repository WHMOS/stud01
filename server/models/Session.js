const { executeQuery } = require('../config/database');

class Session {
  static async getAll() {
    const query = `
      SELECT s.*, c.name as class_name, t.name as teacher_name, 
             sub.name as subject_name, l.name as location_name, l.room_number
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.start_time DESC
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const query = `
      SELECT s.*, c.name as class_name, t.name as teacher_name, 
             sub.name as subject_name, l.name as location_name, l.room_number
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.id = ?
    `;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(sessionData) {
    console.log('📝 Session.create - البيانات الواردة:', sessionData);
    
    const { class_id, location_id, start_time, end_time, status, notes } = sessionData;
    
    if (!class_id || !start_time || !end_time) {
      throw new Error('class_id و start_time و end_time مطلوبة');
    }
    
    const query = `
      INSERT INTO sessions (class_id, location_id, start_time, end_time, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      class_id, 
      location_id || null, 
      start_time, 
      end_time, 
      status || 'scheduled', 
      notes || null
    ];
    
    console.log('📊 معاملات الاستعلام:', params);
    
    const result = await executeQuery(query, [
      class_id, 
      location_id || null, 
      start_time, 
      end_time, 
      status || 'scheduled', 
      notes || null
    ]);
    
    console.log('✅ تم إنشاء الجلسة بنجاح، ID:', result.insertId);
    return result.insertId;
  }

  static async update(id, sessionData) {
    console.log('✏️ Session.update - البيانات الواردة:', sessionData);
    
    const { class_id, location_id, start_time, end_time, status, notes } = sessionData;
    
    const query = `
      UPDATE sessions 
      SET class_id = ?, location_id = ?, start_time = ?, end_time = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const params = [
      class_id, 
      location_id || null, 
      start_time, 
      end_time, 
      status, 
      notes || null, 
      id
    ];
    
    console.log('📊 معاملات التحديث:', params);
    
    const result = await executeQuery(query, [
      class_id, 
      location_id || null, 
      start_time, 
      end_time, 
      status, 
      notes || null, 
      id
    ]);
    
    console.log('✅ تم تحديث الجلسة، عدد الصفوف المتأثرة:', result.affectedRows);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const query = 'DELETE FROM sessions WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async getActive() {
    const query = `
      SELECT s.*, c.name as class_name, t.name as teacher_name, 
             sub.name as subject_name, l.name as location_name
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.status = 'active'
      ORDER BY s.start_time
    `;
    return await executeQuery(query);
  }

  static async getSessionAttendance(sessionId) {
    const query = `
      SELECT s.id, s.name, s.barcode, a.status, a.timestamp, a.notes
      FROM students s
      JOIN attendance a ON s.id = a.student_id
      WHERE a.session_id = ?
      ORDER BY s.name
    `;
    return await executeQuery(query, [sessionId]);
  }

  static async getSessionReports(sessionId) {
    const query = `
      SELECT s.id, s.name, r.teacher_rating, r.quiz_score, r.participation, 
             r.behavior, r.homework, r.comments
      FROM students s
      JOIN reports r ON s.id = r.student_id
      WHERE r.session_id = ?
      ORDER BY s.name
    `;
    return await executeQuery(query, [sessionId]);
  }
}

module.exports = Session;