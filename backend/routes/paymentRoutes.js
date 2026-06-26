const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../controllers/authController');

router.use(protect);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.removePayment);

module.exports = router;
