const { executeQuery } = require('../config/database');

class Subject {
  static async getAll() {
    const query = `
      SELECT * FROM subjects 
      WHERE is_active = TRUE 
      ORDER BY name
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const query = 'SELECT * FROM subjects WHERE id = ? AND is_active = TRUE';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(subjectData) {
    const { name, description } = subjectData;
    const query = `
      INSERT INTO subjects (name, description) 
      VALUES (?, ?)
    `;
    
    const result = await executeQuery(query, [name, description || null]);
    return result.insertId;
  }

  static async update(id, subjectData) {
    const { name, description } = subjectData;
    const query = `
      UPDATE subjects 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [name, description || null, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM subjects WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Subject;