const { uploadToCloud } = require('../utils/cloudinary-service')
const fs = require('fs/promises')
const createError = require('../utils/create-error')
const prisma = require('../models/prisma')

exports.createProduct = async (req, res, next) => {
    try {
        console.log(req.body)
        console.log(req.files)
        const uploadingFiles = req.files.map(file => {
            const type = file.mimetype.split('/')[0]
            return uploadToCloud(file.path, type)
        })

        const allFiles = await Promise.all(uploadingFiles)

        const product = await prisma.product.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                balance: req.body.balance,
                minPrice: req.body.price,
                maxPrice: req.body.price,
            }
        })
        console.log(product)
        res.status(200).json(product)
    } catch (error) {
        next(createError(error))
        console.log('error asdasads ', error)
    } finally {
        if (req.files) {
            req.files.map(file =>
                fs.unlink(file.path)
            )
        }
    }
}