const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictToAdmin } = require('../controllers/authController');

router.use(protect);
router.use(restrictToAdmin);

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
