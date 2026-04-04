const OrderModel = require('../models/order.model');
const PackageModel = require('../models/package.model');
const UserModel = require('../models/user.model');
const PaymentService = require('../services/payment.service');
const EmailService = require('../services/email.service');

const OrdersController = {
  /**
   * POST /api/orders
   * Create a new order for the authenticated user.
   */
  async createOrder(req, res, next) {
    try {
      const { package_id } = req.body;
      const userId = req.user.id;

      // Validate package exists and is active
      const pkg = await PackageModel.findById(parseInt(package_id, 10));
      if (!pkg || !pkg.is_active) {
        return res.status(404).json({ success: false, message: 'Package not found or inactive.' });
      }

      const orderNumber = await OrderModel.generateOrderNumber();

      const order = await OrderModel.create({
        order_number: orderNumber,
        user_id: userId,
        package_id: pkg.id,
        amount: pkg.price,
        currency: pkg.currency,
      });

      // Initialize payment (BAC placeholder)
      const paymentResult = await PaymentService.initializePayment({
        order_number: order.order_number,
        amount: order.amount,
        currency: order.currency,
      });

      // Add initial status history entry
      await OrderModel.addStatusHistory({
        order_id: order.id,
        previous_status: null,
        new_status: 'pending',
        changed_by: userId,
        notes: 'Order created.',
      });

      // Fire-and-forget emails
      const user = await UserModel.findById(userId);
      EmailService.sendOrderConfirmation(user, order, pkg, user.preferred_language);
      EmailService.sendAdminNewOrderNotification(order, user, pkg);

      res.status(201).json({
        success: true,
        message: 'Order created successfully.',
        data: {
          order,
          payment: paymentResult,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/my-orders
   * List all orders for the authenticated user.
   */
  async getMyOrders(req, res, next) {
    try {
      const orders = await OrderModel.findByUserId(req.user.id);
      res.json({ success: true, data: { orders } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/:id
   * Get a single order (verified ownership).
   */
  async getOrderById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID.' });
      }

      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Verify ownership
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      res.json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/orders/:id/payment-callback
   * Placeholder for BAC webhook / payment callback.
   */
  async paymentCallback(req, res, next) {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID.' });
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const verification = await PaymentService.verifyPayment({
        transaction_id: req.body.transaction_id,
        order_number: order.order_number,
        status: req.body.status,
      });

      if (verification.verified) {
        await OrderModel.updateStatus(
          orderId,
          'paid',
          verification.payment_reference,
          verification.payment_method,
          verification.payment_date
        );

        await OrderModel.addStatusHistory({
          order_id: orderId,
          previous_status: order.status,
          new_status: 'paid',
          changed_by: order.user_id,
          notes: 'Payment confirmed via callback.',
        });
      }

      res.json({
        success: true,
        data: { verification },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = OrdersController;
