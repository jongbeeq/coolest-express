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

        let combineItemsCreatingOrder = []
        const productOptionalsCreating = req.body.types.map(type => {
            const items = req.body[`${type}/items`]
            const itemData = Array.isArray(items) ? items : [items]

            let combineItemsCreatingTypeMap = []
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
                    const combineItemTotal = req.body.types.reduce((allTypes, type) => {
                        allTypes[type] = 0
                        return allTypes
                    }, {})
                    console.log(combineItemTotal)
                    for (let key in req.body) {
                        const combineItemType = key.endsWith('/combineItems') && key.split('-')[0]
                        if (combineItemType in combineItemTotal) {
                            const increase = Array.isArray(req.body[key]) ? req.body[key].length : 1
                            combineItemTotal[combineItemType] += increase
                        }
                    }

                    console.log(combineItemTotal)

                    const combineItemData = genDBManyData(req.body[`${type}-${item}/combineItems`], 'title')

                    console.log("81-type ", type)
                    console.log("82-item ", item)
                    console.log("83-combineItemData ", combineItemData)

                    const primaryItemData = {
                        title: item,
                        productId: product.id,
                        optionalTypeItems: {
                            create: {
                                productOptionalTypeId: productOptionalType.id
                            }
                        }
                    }

                    if (fileItem) {
                        primaryItemData.images = {
                            create: {
                                productId: product.id,
                                src: objectFile[`${type}-${item}/image`][0],
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

                        //##################################################

                        const combineItemsCreatingMap = combineItemData.map((itemCombine) => {
                            const combineItemsCreating = async () => {
                                console.log("122-asdsa;das;ka;ldk ", item)
                                const isExistCombineItem = await prisma.productOptionalItem.findFirst({
                                    where: {
                                        title: itemCombine.title,
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
                                    console.log("187 asdnaskjdha ", updateCombieItem)
                                    return updateCombieItem
                                }

                                const combineItem = await prisma.productOptionalItem.create({
                                    data: {
                                        title: itemCombine.title,
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

                                console.log(`208 combineItem/${type}/${item} `, combineItem)

                                return combineItem
                            }

                            return combineItemsCreating

                            // return combineItemsCreating
                        }
                        )

                        console.log(`224 combineItemsCreatingMap/${type}/${item}}`, combineItemsCreatingMap)
                        // console.dir(`222 combineItemsCreatingOrder[0]/${type}/${item}}`, await combineItemsCreatingMap[0]())
                        combineItemsCreatingTypeMap = [...combineItemsCreatingTypeMap, ...combineItemsCreatingMap]
                        console.log(`227 combineItemsCreatingTypeMap/${type}/${item}}`, combineItemsCreatingTypeMap)
                        console.log(`243 combineItemTotal/${type}}`, combineItemTotal[type])
                        console.log(`244 combineItemsCreatingTypeMap.length/${type}}`, combineItemsCreatingTypeMap.length)
                        console.log(`245 combineItemsCreatingTypeMap.length === combineItemTotal/${type}}`, combineItemsCreatingTypeMap.length === combineItemTotal[type])
                        if (combineItemsCreatingTypeMap.length === combineItemTotal[type]) {
                            const combineItemsCreatingType = async () => {
                                const combineItemsCreatingTypeMapCall = combineItemsCreatingTypeMap.map((fn) => fn())
                                console.log(`249 combineItemsCreatingTypeMapCall/${type}/${item}`, combineItemsCreatingTypeMapCall)
                                return await Promise.all(combineItemsCreatingTypeMapCall)
                            }
                            console.log(`252 combineItemsCreatingType/${type}/${item}}`, combineItemsCreatingType)
                            combineItemsCreatingOrder = [...combineItemsCreatingOrder, combineItemsCreatingType]
                            console.log(`254 combineItemsCreatingOrder/${type}/${item}}`, combineItemsCreatingOrder)
                        }
                        const combineItemsCreatingOrderCall = combineItemsCreatingOrder.length === req.body.types.length &&
                            // combineItemsCreatingOrder.reduce((fn, pmAll) => fn().then(() => pmAll()), async () => { })
                            combineItemsCreatingOrder.reduce((fn, pmAll) => {
                                console.log(`259 fn/${type}/${item}}`, fn)
                                console.log(`260 pmAll/${type}/${item}}`, pmAll)
                                console.log(`261 (typeof fn) === 'function'/${type}/${item}}`, (typeof fn) === 'function')
                                return (typeof fn) === 'function' ? fn().then(() => pmAll()) : fn.then(() => pmAll())
                                // return fn().then(() => pmAll())
                            })
                        console.log(`263 combineItemsCreatingOrderCall/${type}/${item}} `, combineItemsCreatingOrderCall)
                        // await combineItemsCreatingOrderCall()
                        //##################################################

                        // const combineItemsCreating = combineItemData.map(async (item) => {
                        //     console.log("122-asdsa;das;ka;ldk ", item)
                        //     const isExistCombineItem = await prisma.productOptionalItem.findFirst({
                        //         where: {
                        //             title: item.title,
                        //             productId: product.id
                        //         }
                        //     })

                        //     console.log("131 dasdwww ", isExistCombineItem)

                        //     if (isExistCombineItem) {
                        //         const updateCombieItem = await prisma.combineOptionalItem.create({
                        //             data: {
                        //                 primaryId: primaryItem.id,
                        //                 combineId: isExistCombineItem.id,
                        //             }
                        //         })
                        //         console.log("187 asdnaskjdha ", updateCombieItem)
                        //         return updateCombieItem
                        //     }

                        //     const combineItem = await prisma.productOptionalItem.create({
                        //         data: {
                        //             title: item.title,
                        //             productId: product.id,
                        //             combineItem: {
                        //                 create: {
                        //                     primaryId: primaryItem.id,
                        //                 }
                        //             },
                        //             optionalTypeItems: {
                        //                 create: {
                        //                     productOptionalTypeId: productOptionalType.id
                        //                 }
                        //             }
                        //         }
                        //     })

                        //     console.log("208 asdnaskjdha ", combineItem)

                        //     const a = await prisma.productOptionalItem.findFirst({
                        //         where: {
                        //             title: item.title,
                        //             productId: product.id
                        //         }
                        //     })

                        //     console.log("217 test ", a)
                        //     return combineItem
                        // }
                        // )
                        // const combineItems = await Promise.all(combineItemsCreating)

                        const result = { primaryItem }

                        return result
                    }
                    return productItemPromise()
                })

                // productOptionalType.items = productOptionalItem
                return productOptionalType
            }

            return productOptionalPromise()
        })

        const productOptionals = await Promise.all(productOptionalsCreating)
        // console.log("297 combineItemsCreatingOrder", combineItemsCreatingOrder)

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