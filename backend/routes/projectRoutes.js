const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.get('/:id/detail', projectController.getProjectDetail);
router.put('/:id', projectController.updateProject);
router.patch('/:id/status', projectController.updateProjectStatus);

module.exports = router;
