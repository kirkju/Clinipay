const OrderModel = require('../models/order.model');
const PackageModel = require('../models/package.model');
const UserModel = require('../models/user.model');
const { VALID_TRANSITIONS } = require('../config/constants');

const AdminController = {
  // ── Orders ──────────────────────────────────────────────────────

  /**
   * GET /api/admin/orders
   * List all orders with optional filters and pagination.
   */
  async getAllOrders(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await OrderModel.findAll({
        status,
        search,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/orders/:id
   * Full order detail including status history.
   */
  async getOrderDetail(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID.' });
      }

      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const statusHistory = await OrderModel.getStatusHistory(id);

      res.json({ success: true, data: { order, statusHistory } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/orders/:id/status
   * Update order status with transition validation.
   */
  async updateOrderStatus(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID.' });
      }

      const { status: newStatus, notes } = req.body;

      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Validate transition
      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed || !allowed.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from "${order.status}" to "${newStatus}".`,
        });
      }

      const updated = await OrderModel.updateStatus(id, newStatus);

      await OrderModel.addStatusHistory({
        order_id: id,
        previous_status: order.status,
        new_status: newStatus,
        changed_by: req.user.id,
        notes: notes || null,
      });

      res.json({
        success: true,
        message: `Order status updated to "${newStatus}".`,
        data: { order: updated },
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Packages ────────────────────────────────────────────────────

  /**
   * GET /api/admin/packages
   * List all packages including inactive.
   */
  async getAllPackages(req, res, next) {
    try {
      const packages = await PackageModel.findAll();
      res.json({ success: true, data: { packages } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/admin/packages
   * Create a new package.
   */
  async createPackage(req, res, next) {
    try {
      const data = req.body;

      // Stringify includes arrays if they come as arrays
      if (Array.isArray(data.includes_es)) {
        data.includes_es = JSON.stringify(data.includes_es);
      }
      if (Array.isArray(data.includes_en)) {
        data.includes_en = JSON.stringify(data.includes_en);
      }

      const pkg = await PackageModel.create(data);
      res.status(201).json({ success: true, message: 'Package created.', data: { package: pkg } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/admin/packages/:id
   * Update an existing package.
   */
  async updatePackage(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid package ID.' });
      }

      const existing = await PackageModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Package not found.' });
      }

      const data = req.body;

      if (Array.isArray(data.includes_es)) {
        data.includes_es = JSON.stringify(data.includes_es);
      }
      if (Array.isArray(data.includes_en)) {
        data.includes_en = JSON.stringify(data.includes_en);
      }

      const pkg = await PackageModel.update(id, data);
      res.json({ success: true, message: 'Package updated.', data: { package: pkg } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/admin/packages/:id/toggle
   * Activate or deactivate a package.
   */
  async togglePackage(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid package ID.' });
      }

      const pkg = await PackageModel.toggleActive(id);
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'Package not found.' });
      }

      const state = pkg.is_active ? 'activated' : 'deactivated';
      res.json({ success: true, message: `Package ${state}.`, data: { package: pkg } });
    } catch (error) {
      next(error);
    }
  },

  // ── Users ───────────────────────────────────────────────────────

  /**
   * GET /api/admin/users
   * List all users with order count.
   */
  async getUsers(req, res, next) {
    try {
      const users = await UserModel.getAll();
      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  },

  // ── Dashboard ───────────────────────────────────────────────────

  /**
   * GET /api/admin/dashboard
   * Aggregate stats for the admin dashboard.
   */
  async getDashboard(req, res, next) {
    try {
      const stats = await OrderModel.getDashboardStats();
      res.json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AdminController;
