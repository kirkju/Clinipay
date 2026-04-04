const { getPool, sql } = require('../config/db');

const OrderModel = {
  /**
   * Create a new order and return the inserted record.
   */
  async create({ order_number, user_id, package_id, amount, currency }) {
    const pool = await getPool();
    const result = await pool.request()
      .input('order_number', sql.NVarChar(50), order_number)
      .input('user_id', sql.Int, user_id)
      .input('package_id', sql.Int, package_id)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('currency', sql.NVarChar(3), currency || 'USD')
      .query(`
        INSERT INTO orders (order_number, user_id, package_id, amount, currency)
        OUTPUT INSERTED.*
        VALUES (@order_number, @user_id, @package_id, @amount, @currency)
      `);
    return result.recordset[0];
  },

  /**
   * Find a single order by ID, joined with user and package names.
   */
  async findById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          o.*,
          u.email AS user_email,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name,
          p.name_es AS package_name_es,
          p.name_en AS package_name_en
        FROM orders o
        INNER JOIN users u ON u.id = o.user_id
        INNER JOIN packages p ON p.id = o.package_id
        WHERE o.id = @id
      `);
    return result.recordset[0] || null;
  },

  /**
   * Find all orders for a specific user.
   */
  async findByUserId(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT
          o.*,
          p.name_es AS package_name_es,
          p.name_en AS package_name_en
        FROM orders o
        INNER JOIN packages p ON p.id = o.package_id
        WHERE o.user_id = @user_id
        ORDER BY o.created_at DESC
      `);
    return result.recordset;
  },

  /**
   * Admin: find all orders with optional filters, pagination, and search.
   */
  async findAll({ status, search, page = 1, limit = 20 } = {}) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const request = pool.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    if (status) {
      whereClause += ' AND o.status = @status';
      request.input('status', sql.NVarChar(30), status);
    }

    if (search) {
      whereClause += ` AND (
        o.order_number LIKE @search
        OR u.email LIKE @search
        OR u.first_name LIKE @search
        OR u.last_name LIKE @search
      )`;
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE ${whereClause}
    `);

    // Get paginated results (new request to avoid duplicate input names)
    const dataRequest = pool.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    if (status) {
      dataRequest.input('status', sql.NVarChar(30), status);
    }
    if (search) {
      dataRequest.input('search', sql.NVarChar(255), `%${search}%`);
    }

    const dataResult = await dataRequest.query(`
      SELECT
        o.*,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        p.name_es AS package_name_es,
        p.name_en AS package_name_en
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      INNER JOIN packages p ON p.id = o.package_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      orders: dataResult.recordset,
      total: countResult.recordset[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult.recordset[0].total / limit),
    };
  },

  /**
   * Update order status and optional payment fields.
   */
  async updateStatus(id, status, paymentReference = null, paymentMethod = null, paymentDate = null) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(30), status)
      .input('payment_reference', sql.NVarChar(255), paymentReference)
      .input('payment_method', sql.NVarChar(50), paymentMethod)
      .input('payment_date', sql.DateTime2, paymentDate)
      .query(`
        UPDATE orders
        SET status = @status,
            payment_reference = COALESCE(@payment_reference, payment_reference),
            payment_method = COALESCE(@payment_method, payment_method),
            payment_date = COALESCE(@payment_date, payment_date),
            updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    return result.recordset[0] || null;
  },

  /**
   * Update admin notes on an order.
   */
  async updateNotes(id, notes) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .query(`
        UPDATE orders SET notes = @notes, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    return result.recordset[0] || null;
  },

  /**
   * Add a status-history entry.
   */
  async addStatusHistory({ order_id, previous_status, new_status, changed_by, notes = null }) {
    const pool = await getPool();
    const result = await pool.request()
      .input('order_id', sql.Int, order_id)
      .input('previous_status', sql.NVarChar(30), previous_status)
      .input('new_status', sql.NVarChar(30), new_status)
      .input('changed_by', sql.Int, changed_by)
      .input('notes', sql.NVarChar(500), notes)
      .query(`
        INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
        OUTPUT INSERTED.*
        VALUES (@order_id, @previous_status, @new_status, @changed_by, @notes)
      `);
    return result.recordset[0];
  },

  /**
   * Get the full status history for an order.
   */
  async getStatusHistory(orderId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('order_id', sql.Int, orderId)
      .query(`
        SELECT
          h.*,
          u.first_name AS changed_by_first_name,
          u.last_name AS changed_by_last_name
        FROM order_status_history h
        INNER JOIN users u ON u.id = h.changed_by
        WHERE h.order_id = @order_id
        ORDER BY h.created_at ASC
      `);
    return result.recordset;
  },

  /**
   * Get dashboard statistics for admin.
   */
  async getDashboardStats() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status IN ('paid', 'in_progress', 'completed')) AS total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'client') AS total_users
    `);
    return result.recordset[0];
  },

  /**
   * Generate a unique order number in the format CLN-YYYYMMDD-NNNN.
   */
  async generateOrderNumber(retries = 3) {
    const pool = await getPool();
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `CLN-${datePart}-`;

    // Use a serializable transaction to prevent race conditions
    const transaction = pool.transaction();
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const result = await transaction.request()
        .input('prefix', sql.NVarChar(50), `${prefix}%`)
        .query(`
          SELECT TOP 1 order_number
          FROM orders WITH (UPDLOCK, HOLDLOCK)
          WHERE order_number LIKE @prefix
          ORDER BY order_number DESC
        `);

      let nextNum = 1;
      if (result.recordset.length > 0) {
        const lastNumber = result.recordset[0].order_number;
        const lastSeq = parseInt(lastNumber.split('-')[2], 10);
        nextNum = lastSeq + 1;
      }

      const orderNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;
      await transaction.commit();
      return orderNumber;
    } catch (err) {
      await transaction.rollback();
      if (retries > 0) {
        return this.generateOrderNumber(retries - 1);
      }
      throw err;
    }
  },
};

module.exports = OrderModel;
