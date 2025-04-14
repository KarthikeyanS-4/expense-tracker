const express = require('express');
const { registerDriver, getAllDrivers } = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', authMiddleware, registerDriver);
router.get('/', getAllDrivers);

module.exports = router;