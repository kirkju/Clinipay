const { Router } = require('express');
const OrdersController = require('../controllers/orders.controller');
const { verifyToken } = require('../middleware/auth');
const { createOrderValidation } = require('../validators/order.validator');

const router = Router();

router.post('/', verifyToken, createOrderValidation, OrdersController.createOrder);
router.get('/my-orders', verifyToken, OrdersController.getMyOrders);
router.get('/:id', verifyToken, OrdersController.getOrderById);
router.post('/:id/simulate-payment', verifyToken, OrdersController.simulatePayment);
router.post('/:id/payment-callback', OrdersController.paymentCallback);

module.exports = router;
