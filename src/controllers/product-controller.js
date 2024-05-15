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

        const genDBManyData = (data, col) => {
            return data.map(src => {
                return { productId: product.id, [col]: src }
            })
        }

        // const filesOnCloud = await Promise.all(uploadingFiles)

        const product = await prisma.product.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                balance: +req.body.balance,
                minPrice: +req.body.price,
            },
        })

        req.body.types.map(type => {
            return
        })

        const typeData = genDBManyData(req.body.types, 'title')

        // const productType = await prisma.productOptionalType.createMany({
        //     data: typeData
        // })
        // console.log(req.body[`${req.body.types[0]}/items`])

        const itemData = genDBManyData(req.body[`${req.body.types[0]}/items`], "title")

        const productOptional = await prisma.productOptionalType.create({
            data: {
                title: req.body.types[0],
                productId: product.id,
                productOptionalItems: {
                    createMany: {
                        data: itemData
                    }
                }
            },

        })


        // console.log(productType)
        console.log(product)

        // const filesProduct = filesOnCloud.map(src => {
        //     return { productId: product.id, src: src }
        // })

        // console.log(filesProduct)

        // const productImage = await prisma.image.createMany({
        //     data: filesProduct
        // })


        console.log(product)
        // const respond = { product, productImage }
        const respond = { product, productType }
        res.status(200).json(respond)
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