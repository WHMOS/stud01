const { executeQuery } = require('../config/database');

class Student {
  static async getAll() {
    const query = `
      SELECT s.*, c.name as class_name, sub.name as subject_name, t.name as teacher_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE s.is_active = TRUE
      ORDER BY s.name
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const query = `
      SELECT s.*, c.name as class_name, sub.name as subject_name, t.name as teacher_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE s.id = ? AND s.is_active = TRUE
    `;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async findByBarcode(barcode) {
    const query = 'SELECT * FROM students WHERE barcode = ? AND is_active = TRUE';
    const results = await executeQuery(query, [barcode]);
    return results[0] || null;
  }

  static async create(studentData) {
    const { name, barcode, parent_phone, class_id } = studentData;
    const query = `
      INSERT INTO students (name, barcode, parent_phone, class_id) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [name, barcode, parent_phone, class_id || null]);
    return result.insertId;
  }

  static async update(id, studentData) {
    const { name, parent_phone, class_id } = studentData;
    const query = `
      UPDATE students 
      SET name = ?, parent_phone = ?, class_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [name, parent_phone, class_id || null, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM students WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async generateBarcode() {
    const query = 'SELECT barcode FROM students WHERE barcode LIKE "STUD%" ORDER BY barcode DESC LIMIT 1';
    const results = await executeQuery(query);
    
    if (results.length === 0) {
      return 'STUD000001';
    }
    
    const lastBarcode = results[0].barcode;
    const number = parseInt(lastBarcode.replace('STUD', '')) + 1;
    return `STUD${number.toString().padStart(6, '0')}`;
  }

  static async getByClass(classId) {
    const query = `
      SELECT s.*, c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = ? AND s.is_active = TRUE
      ORDER BY s.name
    `;
    return await executeQuery(query, [classId]);
  }

  static async removeFromClass(studentId) {
    const query = 'UPDATE students SET class_id = NULL WHERE id = ?';
    const result = await executeQuery(query, [studentId]);
    return result.affectedRows > 0;
  }

  static async transferToClass(studentId, newClassId) {
    const query = 'UPDATE students SET class_id = ? WHERE id = ?';
    const result = await executeQuery(query, [newClassId, studentId]);
    return result.affectedRows > 0;
  }
}

module.exports = Student;