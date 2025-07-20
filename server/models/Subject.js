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
    // Check if subject is being used by any teachers
    const usageQuery = 'SELECT COUNT(*) as count FROM teachers WHERE subject_id = ?';
    const usage = await executeQuery(usageQuery, [id]);
    
    if (usage[0].count > 0) {
      throw new Error('لا يمكن حذف هذه المادة لأنها مرتبطة بمعلمين');
    }

    const query = 'UPDATE subjects SET is_active = FALSE WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Subject;