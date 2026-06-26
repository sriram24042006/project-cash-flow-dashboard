const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/contractsController');
const { protect } = require('../controllers/authController');

router.use(protect);

router.get('/', contractsController.getContracts);
router.post('/', contractsController.createContracts);
router.put('/:id', contractsController.updateContract);
router.delete('/:id', contractsController.removeContract);

module.exports = router;
