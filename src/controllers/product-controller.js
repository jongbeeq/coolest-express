const { uploadToCloud } = require('../utils/cloudinary-service')
const fs = require('fs/promises')
const createError = require('../utils/create-error')
const prisma = require('../models/prisma')

exports.createProduct = async (req, res, next) => {
    try {
        console.log(req.body)
        console.log(req.files)

        const genDBManyData = (datas, col, fixField) => {
            if (!Array.isArray(datas)) {
                return [{ ...fixField, [col]: datas }]
            }

            return datas.map(data => {
                return { ...fixField, [col]: data }
            })
        }

        const productData = {
            title: req.body.title,
            description: req.body.description,
            balance: +req.body.balance,
            minPrice: +req.body.price,
        }

        let generalImages

        if (req.files.length) {
            console.log('welcome files ', req.files)
            const uploadingFiles = req.files.map(file => {
                const uploadFile = async () => {
                    const type = file.mimetype.split('/')[0]
                    return { [file.fieldname]: await uploadToCloud(file.path, type) }
                }
                return uploadFile()
            })

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

            generalImages = genDBManyData(objectFile.image, 'src')

            productData.images = {
                createMany: {
                    data: generalImages
                }
            }
        }


        const product = await prisma.product.create({
            data: productData
        })

        const productOptionalsCreating = req.body.types.map(type => {
            const items = req.body[`${type}/items`]
            const itemData = Array.isArray(items) ? items : [items]

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
                    const fileItem = req.files.length && objectFile[`${type}-${item}/image`]
                    const combineItemData = genDBManyData(req.body[`${type}-${item}/combineItems`], 'title')

                    console.log("81-type ", type)
                    console.log("82-item ", item)
                    console.log("83-combineItemData ", combineItemData)

                    const primaryItemData = fileItem ?
                        {
                            title: item,
                            productId: product.id,
                            optionalTypeItems: {
                                create: {
                                    productOptionalTypeId: productOptionalType.id
                                }
                            },
                            images: {
                                create: {
                                    productId: product.id,
                                    src: objectFile[`${type}-${item}/image`][0],
                                }
                            },
                        }
                        :
                        {
                            title: item,
                            productId: product.id,
                            optionalTypeItems: {
                                create: {
                                    productOptionalTypeId: productOptionalType.id
                                }
                            }
                        }

                    const productItemPromise = async () => {
                        const primaryItem = await prisma.productOptionalItem.create({
                            data: primaryItemData,
                            include: {
                                images: true
                            }
                        })

                        // const combineItems = combineItemData.map((item) => {
                        //     const combineItemsCreating = async () => {
                        //         console.log("122-asdsa;das;ka;ldk ", item)
                        //         const isExistCombineItem = await prisma.productOptionalItem.findFirst({
                        //             where: {
                        //                 title: item.title,
                        //                 productId: product.id
                        //             }
                        //         })

                        //         console.log("131 dasdwww ", isExistCombineItem)

                        //         if (isExistCombineItem) {
                        //             const updateCombieItem = await prisma.combineOptionalItem.create({
                        //                 data: {
                        //                     primaryId: primaryItem.id,
                        //                     combineId: isExistCombineItem.id,
                        //                 }
                        //             })
                        //             console.log(updateCombieItem)
                        //             return updateCombieItem
                        //         }

                        //         const combineItem = await prisma.productOptionalItem.create({
                        //             data: {
                        //                 title: item.title,
                        //                 productId: product.id,
                        //                 combineItem: {
                        //                     create: {
                        //                         primaryId: primaryItem.id,
                        //                     }
                        //                 },
                        //                 optionalTypeItems: {
                        //                     create: {
                        //                         productOptionalTypeId: productOptionalType.id
                        //                     }
                        //                 }
                        //             }
                        //         })
                        //         return combineItem
                        //     }
                        //     let result
                        //     combineItemsCreating().then(res => result = res)
                        //     console.log("164 combineItemsCreating----------- ", result)

                        // }
                        // )

                        const combineItemsCreating = combineItemData.map(async (item) => {
                            console.log("122-asdsa;das;ka;ldk ", item)
                            const isExistCombineItem = await prisma.productOptionalItem.findFirst({
                                where: {
                                    title: item.title,
                                    productId: product.id
                                }
                            })

                            console.log("131 dasdwww ", isExistCombineItem)

                            if (isExistCombineItem) {
                                const updateCombieItem = await prisma.combineOptionalItem.create({
                                    data: {
                                        primaryId: primaryItem.id,
                                        combineId: isExistCombineItem.id,
                                    }
                                })
                                console.log(updateCombieItem)
                                return updateCombieItem
                            }

                            const combineItem = await prisma.productOptionalItem.create({
                                data: {
                                    title: item.title,
                                    productId: product.id,
                                    combineItem: {
                                        create: {
                                            primaryId: primaryItem.id,
                                        }
                                    },
                                    optionalTypeItems: {
                                        create: {
                                            productOptionalTypeId: productOptionalType.id
                                        }
                                    }
                                }
                            })
                            return combineItem
                        }
                        )
                        const combineItems = await Promise.all(combineItemsCreating)

                        const result = { primaryItem, combineItems }

                        return result
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
        console.log('error asdasads ', error)
        next(createError(error))
    } finally {
        if (req.files) {
            req.files.map(file =>
                fs.unlink(file.path)
            )
        }
    }
}