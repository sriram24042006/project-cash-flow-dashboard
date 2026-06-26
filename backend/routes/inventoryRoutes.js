const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../controllers/authController');

router.use(protect);

router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.createInventory);
router.put('/:id', inventoryController.updateInventory);
router.delete('/:id', inventoryController.removeInventory);

module.exports = router;
