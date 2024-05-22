const express = require('express')

const uploadMiddleware = require('../middlewares/upload')
const productController = require('../controllers/product-controller')
const prisma = require('../models/prisma')

const router = express.Router()

router.post('/create',
    uploadMiddleware.any(),
    productController.createProduct
)

module.exports = router;