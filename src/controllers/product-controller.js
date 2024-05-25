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

        let combineItemsData = {}
        let maxPrice = +req.body.price
        let minPrice = +req.body.price
        for (let key in req.body) {
            // Create Combine-item Data
            const combineItemsSplit = key.split('/combineItems')
            const countCombineItem = combineItemsSplit[1]
            if (countCombineItem) {
                const combineItemNum = `combineItems${countCombineItem}`
                const primaryItem = combineItemsSplit[0]
                const combineItems = req.body[key]
                const combineItemsArray = Array.isArray(combineItems) ? combineItems : [combineItems]
                for (let item of combineItemsArray) {
                    const numExist = (combineItemNum in combineItemsData)
                    const itemExist = typeof combineItemsData[combineItemNum] === 'object' && (item in combineItemsData[combineItemNum])
                    const combineItemExist = numExist && itemExist
                    if (combineItemExist) {
                        console.log('145 adasd ', combineItemsData)
                        combineItemsData[combineItemNum][item].primaryId = [...combineItemsData[combineItemNum][item].primaryId, primaryItem]
                    } else {
                        combineItemsData[combineItemNum] = numExist ? { ...combineItemsData[combineItemNum] } : {}
                        combineItemsData[combineItemNum][item] = { primaryId: [primaryItem] }
                    }
                }
            }

            // Create Max/Min-price
            const isPrice = key.endsWith('/price')
            if (isPrice) {
                maxPrice = +req.body[key] > maxPrice ? +req.body[key] : maxPrice
                minPrice = +req.body[key] < minPrice ? +req.body[key] : minPrice
            }
        }

        console.log('1.1 combineItemsData-----', combineItemsData)

        const productData = {
            title: req.body.title,
            description: req.body.description,
            balance: +req.body.balance || 0,
            minPrice: minPrice,
            maxPrice: maxPrice,
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

            generalImages = genDBManyData(objectFile.images, 'src')

            productData.images = {
                createMany: {
                    data: generalImages
                }
            }
        }

        if (req.body.category) {
            const categoryData = genDBManyData(req.body.category, 'categoryTitle')
            productData.productCategorys = {
                createMany: {
                    data: categoryData
                }
            }
        }

        const product = await prisma.product.create({
            data: productData
        })


        // 1.Create Type
        if (req.body.types) {
            const productTypesPromise = req.body.types.map((title) => {
                const createType = async () => {
                    const type = await prisma.productOptionalType.create({
                        data: {
                            title: title,
                            productId: product.id
                        }
                    })
                    const typeId = { [title]: type.id }
                    return typeId
                }
                return createType()
            })

            const productTypesId = (await Promise.all(productTypesPromise)).reduce((obj, type) => {
                return { ...obj, ...type }
            })

            console.log("1 productTypes----", productTypesId)


            // 2.Create Item
            let productItemsPromise = []
            for (let key in productTypesId) {
                const items = req.body[`${key}/items`]
                const itemsData = Array.isArray(items) ? items : [items]
                const itemsPromise = itemsData.map((title) => {
                    const createItem = async () => {
                        const item = await prisma.productOptionalItem.create({
                            data: {
                                title: title,
                                productId: product.id,
                                balance: +req.body[`${title}/balance`] || 0,
                                price: +req.body[`${title}/price`] || +req.body.price,
                                optionalTypeItems: {
                                    create: {
                                        productOptionalTypeId: productTypesId[key]
                                    }
                                },
                            }
                        })

                        const itemId = { [`${key}-${title}`]: item.id }
                        return itemId
                    }
                    return createItem()
                })
                productItemsPromise = [...productItemsPromise, ...itemsPromise]
            }

            const productItemsId = (await Promise.all(productItemsPromise)).reduce((obj, item) => {
                return { ...obj, ...item }
            })

            console.log("2 productItemsId----", productItemsId)

            // 3.Create Combine-item
            const createCombineItem = async (combineItemsDataNum) => {
                let productCombineItemsPromise = []
                for (let key in combineItemsDataNum) {
                    const createCombineItems = async () => {
                        const combineItem = await prisma.productOptionalItem.create({
                            data: {
                                title: key,
                                balance: +req.body[`${key}/balance`] || 0,
                                price: +req.body[`${key}/price`] || +req.body.price,
                                productId: product.id,
                                combineItem: {
                                    createMany: {
                                        data: combineItemsDataNum[key].primaryId
                                    }
                                }
                            }
                        })

                        return { [key]: combineItem.id }
                    }
                    productCombineItemsPromise = [...productCombineItemsPromise, createCombineItems()]
                }

                const productCombineItemsId = (await Promise.all(productCombineItemsPromise)).reduce((obj, type) => {
                    return { ...obj, ...type }
                })
                console.log("4 productCombineItemsId----", productCombineItemsId)

                return productCombineItemsId
            }

            let nextPrimaryItemsIdData = {}
            for (let key in combineItemsData) {
                const combineItemsField = key
                const combineItemsFieldData = combineItemsData[combineItemsField]
                const numCombineItem = combineItemsField.split('combineItems')[1]
                for (let key in combineItemsFieldData) {
                    console.log("5.1 combineItemsFieldData----", combineItemsFieldData)
                    const combineItem = key
                    const combineItemData = combineItemsFieldData[combineItem]
                    console.log("5.2 combineItemData----", combineItemData)
                    let combineItemDataWithPID = []
                    console.log("5.3 nextPrimaryItemsIdData----", nextPrimaryItemsIdData)
                    for (let item of combineItemData.primaryId) {
                        console.log("5.4 item in combineItemData----", item)
                        const primaryItemId = { primaryId: numCombineItem > 1 ? nextPrimaryItemsIdData[item] : productItemsId[item] }
                        combineItemDataWithPID = [...combineItemDataWithPID, primaryItemId]
                    }
                    combineItemsFieldData[combineItem].primaryId = combineItemDataWithPID
                }

                nextPrimaryItemsIdData = await createCombineItem(combineItemsFieldData)
            }
        }

        // 4.Get Product
        const getProduct = await prisma.product.findUnique({
            where: {
                id: product.id
            },
            include: {
                productCategorys: {
                    select: {
                        categoryTitle: true
                    }
                },
                productOptionalTypes: {
                    select: {
                        id: true,
                        title: true,
                        productId: true,
                        optionalTypeItems: {
                            select: {
                                productOptionalItem: true
                            }
                        }
                    },
                },
                productOptionalItems: {
                    where: {
                        combineItem: {
                            some: {
                                combineId: {
                                    gte: 1
                                }
                            }
                        }
                    },
                    select: {
                        title: true,
                        balance: true,
                        price: true,
                        combineItem: {
                            select: {
                                primaryId: true,
                                combineId: true
                            }
                        }
                    }
                }
            }
        })

        getProduct.combineItems = getProduct.productOptionalItems
        getProduct.productCategorys = getProduct.productCategorys?.map((category) => category.categoryTitle)
        delete getProduct.productOptionalItems
        const respond = getProduct
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