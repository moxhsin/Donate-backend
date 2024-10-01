const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController'); // Import your Auth controller

// User Registration Route
router.post('/register', AuthController.register);

// User Login Route
router.post('/login', AuthController.login);

module.exports = router;
