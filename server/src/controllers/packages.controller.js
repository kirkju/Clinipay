const PackageModel = require('../models/package.model');

const PackagesController = {
  /**
   * GET /api/packages
   * List all active packages (public).
   */
  async getActivePackages(req, res, next) {
    try {
      const packages = await PackageModel.findAllActive();
      res.json({ success: true, data: { packages } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/packages/:id
   * Get a single package by ID (public).
   */
  async getPackageById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid package ID.' });
      }

      const pkg = await PackageModel.findById(id);
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'Package not found.' });
      }

      res.json({ success: true, data: { package: pkg } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = PackagesController;
