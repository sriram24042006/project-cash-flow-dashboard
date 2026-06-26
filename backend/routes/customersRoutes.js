const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { protect } = require('../controllers/authController');

router.use(protect);

router.get('/', customersController.getCustomers);
router.post('/', customersController.createCustomer);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.removeCustomer);

module.exports = router;
