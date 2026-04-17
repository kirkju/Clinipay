const { getPool, sql } = require('../config/db');

const OrderModel = {
  /**
   * Create a new order with items (inside a transaction).
   * @param {Object} orderData - { order_number, user_id, total_amount, currency }
   * @param {Array}  items     - [{ package_id, package_name_es, package_name_en, unit_price, currency, patient_* }]
   */
  async create(orderData, items) {
    const pool = await getPool();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Insert the order header
      const orderResult = await transaction.request()
        .input('order_number', sql.NVarChar(50), orderData.order_number)
        .input('user_id', sql.Int, orderData.user_id)
        .input('total_amount', sql.Decimal(10, 2), orderData.total_amount)
        .input('currency', sql.NVarChar(3), orderData.currency || 'USD')
        .query(`
          INSERT INTO orders (order_number, user_id, total_amount, currency)
          OUTPUT INSERTED.*
          VALUES (@order_number, @user_id, @total_amount, @currency)
        `);

      const order = orderResult.recordset[0];

      // Insert each item
      const insertedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemResult = await transaction.request()
          .input('order_id', sql.Int, order.id)
          .input('package_id', sql.Int, item.package_id)
          .input('package_name_es', sql.NVarChar(255), item.package_name_es)
          .input('package_name_en', sql.NVarChar(255), item.package_name_en || null)
          .input('unit_price', sql.Decimal(10, 2), item.unit_price)
          .input('currency', sql.NVarChar(3), item.currency || 'USD')
          .input('patient_first_name', sql.NVarChar(100), item.patient_first_name)
          .input('patient_last_name', sql.NVarChar(100), item.patient_last_name)
          .input('patient_id_number', sql.NVarChar(50), item.patient_id_number || null)
          .input('patient_phone', sql.NVarChar(30), item.patient_phone)
          .input('patient_email', sql.NVarChar(255), item.patient_email || null)
          .input('patient_birth_date', sql.Date, item.patient_birth_date)
          .input('patient_relationship', sql.NVarChar(30), item.patient_relationship || 'self')
          .input('patient_notes', sql.NVarChar(sql.MAX), item.patient_notes || null)
          .query(`
            INSERT INTO order_items
              (order_id, package_id, package_name_es, package_name_en, unit_price, currency,
               patient_first_name, patient_last_name, patient_id_number, patient_phone,
               patient_email, patient_birth_date, patient_relationship, patient_notes)
            OUTPUT INSERTED.*
            VALUES
              (@order_id, @package_id, @package_name_es, @package_name_en, @unit_price, @currency,
               @patient_first_name, @patient_last_name, @patient_id_number, @patient_phone,
               @patient_email, @patient_birth_date, @patient_relationship, @patient_notes)
          `);
        insertedItems.push(itemResult.recordset[0]);
      }

      await transaction.commit();
      order.items = insertedItems;
      return order;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  /**
   * Find a single order by ID with user info and items.
   */
  async findById(id) {
    const pool = await getPool();

    const orderResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          o.*,
          u.email AS user_email,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name,
          u.phone AS user_phone
        FROM orders o
        INNER JOIN users u ON u.id = o.user_id
        WHERE o.id = @id AND o.deleted_at IS NULL
      `);

    const order = orderResult.recordset[0] || null;
    if (!order) return null;

    const itemsResult = await pool.request()
      .input('order_id', sql.Int, id)
      .query(`
        SELECT * FROM order_items
        WHERE order_id = @order_id AND deleted_at IS NULL
        ORDER BY id ASC
      `);

    order.items = itemsResult.recordset;
    return order;
  },

  /**
   * Find all orders for a specific user (with item count).
   */
  async findByUserId(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT
          o.*,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
          (SELECT TOP 1 oi.package_name_es FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id) AS first_package_name_es,
          (SELECT TOP 1 oi.package_name_en FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id) AS first_package_name_en
        FROM orders o
        WHERE o.user_id = @user_id AND o.deleted_at IS NULL
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

    let whereClause = 'o.deleted_at IS NULL';
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
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT TOP 1 oi.package_name_es FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id) AS first_package_name_es,
        (SELECT TOP 1 oi.package_name_en FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id) AS first_package_name_en
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
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
        WHERE id = @id AND deleted_at IS NULL
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
        WHERE id = @id AND deleted_at IS NULL
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
   * Get items for a specific order.
   */
  async getItemsByOrderId(orderId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('order_id', sql.Int, orderId)
      .query(`
        SELECT * FROM order_items
        WHERE order_id = @order_id AND deleted_at IS NULL
        ORDER BY id ASC
      `);
    return result.recordset;
  },

  /**
   * Get dashboard statistics for admin (excludes soft-deleted).
   */
  async getDashboardStats() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending' AND deleted_at IS NULL) AS pending_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('paid', 'in_progress', 'completed') AND deleted_at IS NULL) AS total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'client' AND deleted_at IS NULL) AS total_users
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
