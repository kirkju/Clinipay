const { Router } = require('express');
const PackagesController = require('../controllers/packages.controller');

const router = Router();

// Public routes
router.get('/', PackagesController.getActivePackages);
router.get('/:id', PackagesController.getPackageById);

module.exports = router;
