const OrderModel = require('../models/order.model');
const PackageModel = require('../models/package.model');
const UserModel = require('../models/user.model');
const PaymentService = require('../services/payment.service');
const EmailService = require('../services/email.service');
const { TAX_RATE, round2, effectiveDiscountPct, computeLineAmounts } = require('../config/constants');

const OrdersController = {
  /**
   * POST /api/orders
   * Create a new order with multiple items + patient info.
   * Body: { items: [{ package_id, patient_first_name, patient_last_name, ... }] }
   */
  async createOrder(req, res, next) {
    try {
      const { items } = req.body;
      const userId = req.user.id;

      // Validate each package and build order items
      const orderItems = [];
      let subtotal = 0;
      let discountTotal = 0;
      let currency = 'USD';

      for (const item of items) {
        const pkg = await PackageModel.findById(parseInt(item.package_id, 10));
        if (!pkg || !pkg.is_active) {
          return res.status(404).json({
            success: false,
            message: `Package not found or inactive (ID: ${item.package_id}).`,
          });
        }

        const { percentage: effectivePct } = effectiveDiscountPct(pkg, item.patient_birth_date);
        const amounts = computeLineAmounts(pkg.price, effectivePct);
        subtotal += amounts.unit;
        discountTotal += amounts.discount;
        currency = pkg.currency || 'USD';

        orderItems.push({
          package_id: pkg.id,
          package_name_es: pkg.name_es,
          package_name_en: pkg.name_en,
          unit_price: pkg.price,
          currency: pkg.currency || 'USD',
          patient_first_name: item.patient_first_name,
          patient_last_name: item.patient_last_name,
          patient_id_number: item.patient_id_number || null,
          patient_phone: item.patient_phone,
          patient_email: item.patient_email || null,
          patient_birth_date: item.patient_birth_date,
          patient_relationship: item.patient_relationship || 'self',
          patient_notes: item.patient_notes || null,
        });
      }

      subtotal = round2(subtotal);
      discountTotal = round2(discountTotal);
      const netSubtotal = round2(subtotal - discountTotal);
      const taxAmount = round2(netSubtotal * TAX_RATE);
      const totalAmount = round2(netSubtotal + taxAmount);

      const orderNumber = await OrderModel.generateOrderNumber();

      const order = await OrderModel.create(
        {
          order_number: orderNumber,
          user_id: userId,
          total_amount: totalAmount,
          currency,
        },
        orderItems,
      );

      // Initialize payment (BAC placeholder)
      const paymentResult = await PaymentService.initializePayment({
        order_number: order.order_number,
        amount: order.total_amount,
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
      EmailService.sendOrderConfirmation(user, order, orderItems, user.preferred_language);
      EmailService.sendAdminNewOrderNotification(order, user, orderItems);

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
   * Get a single order with items (verified ownership).
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

      const statusHistory = await OrderModel.getStatusHistory(id);

      res.json({ success: true, data: { order, statusHistory } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/orders/:id/simulate-payment
   * Dev-only simulated payment flow.
   */
  async simulatePayment(req, res, next) {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID.' });
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (order.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      if (order.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: `Order is already ${order.status} and cannot be paid again.`,
        });
      }

      const success = req.body.success !== false;
      const newStatus = success ? 'paid' : 'cancelled';
      const paymentReference = success ? `SIM-${Date.now()}` : null;
      const paymentMethod = success ? 'simulated' : null;
      const paymentDate = success ? new Date() : null;

      const updated = await OrderModel.updateStatus(
        orderId,
        newStatus,
        paymentReference,
        paymentMethod,
        paymentDate,
      );

      await OrderModel.addStatusHistory({
        order_id: orderId,
        previous_status: 'pending',
        new_status: newStatus,
        changed_by: req.user.id,
        notes: success ? 'Simulated payment succeeded.' : 'Simulated payment failed.',
      });

      res.json({ success: true, data: { order: updated } });
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
          verification.payment_date,
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
