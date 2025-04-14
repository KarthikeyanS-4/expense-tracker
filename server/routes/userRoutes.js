const express = require('express');
const { getProfile, getUserById } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();


router.get('/profile', authMiddleware, getProfile);
//Get User Data Using Id   
router.get('/user/:id', authMiddleware, getUserById);


module.exports = router;
