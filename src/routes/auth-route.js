const express = require('express')

const authController = require('../controllers/auth-controller')
const authenticate = require('../middlewares/authenticate')

const router = express.Router()

router.post('/register/user', authController.register)

router.post('/login', authController.login)

router.get('', authenticate, authController.getMe)

module.exports = router;