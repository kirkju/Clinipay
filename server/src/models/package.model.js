const { getPool, sql } = require('../config/db');

// includes_es / includes_en are persisted as JSON strings. Parse them back to
// arrays on read so every consumer (catalog, detail, checkout, admin) gets the
// shape it expects. Tolerate nulls and already-parsed values.
function parseIncludes(pkg) {
  if (!pkg) return pkg;
  for (const key of ['includes_es', 'includes_en']) {
    const value = pkg[key];
    if (value == null) {
      pkg[key] = [];
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        pkg[key] = Array.isArray(parsed) ? parsed : [];
      } catch {
        pkg[key] = [];
      }
    }
  }
  return pkg;
}

const PackageModel = {
  /**
   * Get all active packages, ordered by display_order.
   */
  async findAllActive() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM packages WHERE is_active = 1 ORDER BY display_order ASC');
    return result.recordset.map(parseIncludes);
  },

  /**
   * Get all packages (including inactive) for admin view.
   */
  async findAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM packages ORDER BY display_order ASC');
    return result.recordset.map(parseIncludes);
  },

  /**
   * Find a single package by ID.
   */
  async findById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM packages WHERE id = @id');
    return parseIncludes(result.recordset[0]) || null;
  },

  /**
   * Create a new package and return the inserted record.
   */
  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name_es', sql.NVarChar(200), data.name_es)
      .input('name_en', sql.NVarChar(200), data.name_en)
      .input('description_es', sql.NVarChar(sql.MAX), data.description_es)
      .input('description_en', sql.NVarChar(sql.MAX), data.description_en)
      .input('price', sql.Decimal(10, 2), data.price)
      .input('currency', sql.NVarChar(3), data.currency || 'USD')
      .input('includes_es', sql.NVarChar(sql.MAX), data.includes_es || null)
      .input('includes_en', sql.NVarChar(sql.MAX), data.includes_en || null)
      .input('display_order', sql.Int, data.display_order || 0)
      .query(`
        INSERT INTO packages (name_es, name_en, description_es, description_en, price, currency, includes_es, includes_en, display_order)
        OUTPUT INSERTED.*
        VALUES (@name_es, @name_en, @description_es, @description_en, @price, @currency, @includes_es, @includes_en, @display_order)
      `);
    return parseIncludes(result.recordset[0]);
  },

  /**
   * Update an existing package. Only provided fields are updated.
   */
  async update(id, data) {
    const pool = await getPool();

    // Build SET clause dynamically for provided fields
    const fields = [];
    const request = pool.request().input('id', sql.Int, id);

    if (data.name_es !== undefined) {
      fields.push('name_es = @name_es');
      request.input('name_es', sql.NVarChar(200), data.name_es);
    }
    if (data.name_en !== undefined) {
      fields.push('name_en = @name_en');
      request.input('name_en', sql.NVarChar(200), data.name_en);
    }
    if (data.description_es !== undefined) {
      fields.push('description_es = @description_es');
      request.input('description_es', sql.NVarChar(sql.MAX), data.description_es);
    }
    if (data.description_en !== undefined) {
      fields.push('description_en = @description_en');
      request.input('description_en', sql.NVarChar(sql.MAX), data.description_en);
    }
    if (data.price !== undefined) {
      fields.push('price = @price');
      request.input('price', sql.Decimal(10, 2), data.price);
    }
    if (data.currency !== undefined) {
      fields.push('currency = @currency');
      request.input('currency', sql.NVarChar(3), data.currency);
    }
    if (data.includes_es !== undefined) {
      fields.push('includes_es = @includes_es');
      request.input('includes_es', sql.NVarChar(sql.MAX), data.includes_es);
    }
    if (data.includes_en !== undefined) {
      fields.push('includes_en = @includes_en');
      request.input('includes_en', sql.NVarChar(sql.MAX), data.includes_en);
    }
    if (data.display_order !== undefined) {
      fields.push('display_order = @display_order');
      request.input('display_order', sql.Int, data.display_order);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = GETUTCDATE()');

    const result = await request.query(`
      UPDATE packages SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id
    `);
    return parseIncludes(result.recordset[0]) || null;
  },

  /**
   * Toggle the is_active flag on a package.
   */
  async toggleActive(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE packages
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    return parseIncludes(result.recordset[0]) || null;
  },
};

module.exports = PackageModel;
