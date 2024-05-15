const { uploadToCloud } = require('../utils/cloudinary-service')
const fs = require('fs/promises')
const createError = require('../utils/create-error')
const prisma = require('../models/prisma')

exports.createProduct = async (req, res, next) => {
    try {
        console.log(req.body)
        console.log(req.files)
        const uploadingFiles = req.files.map(file => {
            const uploadFile = async () => {
                const type = file.mimetype.split('/')[0]
                return { [file.fieldname]: await uploadToCloud(file.path, type) }
            }
            return uploadFile()
        })

        const genDBManyData = (datas, col, fixField) => {
            if (!Array.isArray(datas)) {
                return { ...fixField, [col]: datas }
            }

            return datas.map(data => {
                return { ...fixField, [col]: data }
            })
        }

        const filesOnCloud = await Promise.all(uploadingFiles)

        console.log(filesOnCloud)

        let objectFile = {}
        for (let item of filesOnCloud) {
            for (let key in item) {
                if (objectFile[key]) {
                    objectFile[key] = [...objectFile[key], item[key]]

                } else {
                    objectFile[key] = [item[key]]
                }
            }
        }

        console.log(objectFile)

        const generalImages = genDBManyData(objectFile.image, 'src')

        const product = await prisma.product.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                balance: +req.body.balance,
                minPrice: +req.body.price,
                images: {
                    createMany: {
                        data: generalImages
                    }
                }
            },
        })



        const productOptionalsCreating = req.body.types.map(type => {
            // const itemData = genDBManyData(req.body[`${type}/items`], "title")
            const items = req.body[`${type}/items`]
            const itemData = Array.isArray(items) ? items : [items]

            console.log(itemData)

            const productOptionalPromise = async () => {
                const productOptionalType = await prisma.productOptionalType.create(
                    {
                        data: {
                            title: type,
                            productId: product.id,
                        }
                    }
                )

                const productOptionalItemCreating = itemData.map(item => {
                    console.log("73-qqqqqqqqqqqq", objectFile[`${type}-${item}/image`])
                    const fileItem = objectFile[`${type}-${item}/image`]
                    const createData = fileItem ?
                        {
                            productOptionalTypeId: productOptionalType.id,
                            title: item,
                            images: {
                                create: {
                                    productId: product.id,
                                    src: objectFile[`${type}-${item}/image`][0],
                                }
                            }
                        }
                        :
                        {
                            productOptionalTypeId: productOptionalType.id,
                            title: item,
                        }

                    const productItemPromise = async () => {
                        return await prisma.productOptionalItem.create({
                            data: createData,
                            include: {
                                images: true
                            }
                        })
                    }
                    return productItemPromise()
                })
                const productOptionalItem = await Promise.all(productOptionalItemCreating)

                productOptionalType.items = productOptionalItem
                return productOptionalType
            }

            return productOptionalPromise()
        })

        const productOptionals = await Promise.all(productOptionalsCreating)

        const respond = { product, productOptionals }
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