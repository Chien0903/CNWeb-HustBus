const express = require('express');
const router = express.Router();
const busRoutesController = require('../controllers/busRoutes.controller');


router.get('/search', busRoutesController.search);
router.get('/details', busRoutesController.getLineDetails);
router.get('/schedule', busRoutesController.getSchedule);

router.post('/', busRoutesController.createRoute);
router.put('/:id', busRoutesController.updateRoute);
router.delete('/:id', busRoutesController.deleteRoute);

module.exports = router;
