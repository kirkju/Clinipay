const { Router } = require('express');
const AdminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { createPackageValidation, updatePackageValidation } = require('../validators/package.validator');
const { updateStatusValidation } = require('../validators/order.validator');

const router = Router();

// All admin routes require authentication + admin or superadmin role
router.use(verifyToken, requireRole('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// Orders
router.get('/orders', AdminController.getAllOrders);
router.get('/orders/:id', AdminController.getOrderDetail);
router.patch('/orders/:id/status', updateStatusValidation, AdminController.updateOrderStatus);

// Packages
router.get('/packages', AdminController.getAllPackages);
router.post('/packages', createPackageValidation, AdminController.createPackage);
router.put('/packages/:id', updatePackageValidation, AdminController.updatePackage);
router.patch('/packages/:id/toggle', AdminController.togglePackage);
router.delete('/packages/:id', AdminController.deletePackage);

// Users
router.get('/users', AdminController.getUsers);
router.delete('/users/:id', AdminController.deleteUser);
router.patch('/users/:id/role', requireRole('superadmin'), AdminController.updateUserRole);

module.exports = router;
