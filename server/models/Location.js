const { executeQuery } = require('../config/database');

class Location {
  static async getAll() {
    const query = `
      SELECT * FROM locations 
      WHERE is_active = TRUE 
      ORDER BY name
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = ? AND is_active = TRUE';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(locationData) {
    const { name, roomNumber, capacity, description } = locationData;
    const query = `
      INSERT INTO locations (name, room_number, capacity, description) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      name, 
      roomNumber || null, 
      capacity || 30, 
      description || null
    ]);
    
    return result.insertId;
  }

  static async update(id, locationData) {
    const { name, roomNumber, capacity, description } = locationData;
    const query = `
      UPDATE locations 
      SET name = ?, room_number = ?, capacity = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [
      name, 
      roomNumber || null, 
      capacity || 30, 
      description || null, 
      id
    ]);
    
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM locations WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async checkUsage(id) {
    const query = `
      SELECT COUNT(*) as sessionCount 
      FROM sessions 
      WHERE location_id = ?
    `;
    const result = await executeQuery(query, [id]);
    return result[0].sessionCount;
  }
}

module.exports = Location;