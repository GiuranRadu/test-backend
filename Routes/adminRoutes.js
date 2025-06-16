const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const {restrictIfNotAdmin } = require('../Controllers/authController');

router.route('/deleteUser/:id').delete(restrictIfNotAdmin, adminController.deleteUser);

module.exports = router;