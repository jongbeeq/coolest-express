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

        // let productTypes = {}
        // for (let item of req.body.types) {
        //     console.log("1 item of req.body.types----", item)
        //     const type = await prisma.productOptionalType.create({
        //         data: {
        //             title: item,
        //             productId: product.id
        //         }
        //     })
        //     console.log("2 type----", type)
        //     productTypes[item] = type.id
        // }

        // 1.Create Type
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
            let itemId = {}
            const itemsPromise = itemsData.map((title) => {
                const createItem = async () => {
                    const item = await prisma.productOptionalItem.create({
                        data: {
                            title: title,
                            productId: product.id,
                            optionalTypeItems: {
                                create: {
                                    productOptionalTypeId: productTypesId[key]
                                }
                            }
                        }
                    })
                    itemId = { ...itemId, [`${key}-${title}`]: item.id }
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
        let combineItemsData = {}
        for (let key in req.body) {
            const keySplit = key.split('/combineItems')
            const countCombineItem = keySplit[1]
            if (countCombineItem) {
                const combineItemNum = `combineItems${countCombineItem}`
                const primaryItem = keySplit[0]
                const combineItems = req.body[key]
                const combineItemsArray = Array.isArray(combineItems) ? combineItems : [combineItems]
                for (let item of combineItemsArray) {
                    const primaryItemId = countCombineItem === "1" ? { primaryId: productItemsId[primaryItem] } : primaryItem
                    const numExist = (combineItemNum in combineItemsData)
                    const itemExist = typeof combineItemsData[combineItemNum] === 'object' && (item in combineItemsData[combineItemNum])
                    const combineItemExist = numExist && itemExist
                    if (combineItemExist) {
                        combineItemsData[combineItemNum][item] = [...combineItemsData[combineItemNum][item], primaryItemId]
                    } else {
                        combineItemsData[combineItemNum] = numExist ? { ...combineItemsData[combineItemNum] } : {}
                        combineItemsData[combineItemNum][item] = [primaryItemId]
                    }
                }
            }
        }
        console.log("3 combineItemsData----", combineItemsData)
        console.log("3.1 combineItemsData/1----", combineItemsData.combineItems1)
        console.log("3.2 combineItemsData/2----", combineItemsData.combineItems2)

        // let productCombineItemsPromise = []
        // for (let key in combineItemsData['combineItems1']) {
        //     const createCombineItems = async () => {
        //         const combineItem = await prisma.productOptionalItem.create({
        //             data: {
        //                 title: key,
        //                 productId: product.id,
        //                 combineItem: {
        //                     createMany: {
        //                         data: combineItemsData['combineItems1'][key]
        //                     }
        //                 }
        //             }
        //         })
        //         return { [key]: combineItem.id }
        //     }
        //     productCombineItemsPromise = [...productCombineItemsPromise, createCombineItems()]
        // }

        // const productCombineItemsId = (await Promise.all(productCombineItemsPromise)).reduce((obj, type) => {
        //     return { ...obj, ...type }
        // })

        // console.log("4 productCombineItemsId----", productCombineItemsId)

        const createCombineItem = async (combineItemsDataNum) => {
            let productCombineItemsPromise = []
            for (let key in combineItemsDataNum) {
                const createCombineItems = async () => {
                    const combineItem = await prisma.productOptionalItem.create({
                        data: {
                            title: key,
                            productId: product.id,
                            combineItem: {
                                createMany: {
                                    data: combineItemsDataNum[key]
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

        // const productCombineItemsIdAfter = await createCombineItem(combineItemsData['combineItems1'])

        // console.log("5 productCombineItemsIdAfter----", productCombineItemsIdAfter)

        let nextPrimaryItemsIdData = {}
        for (let key in combineItemsData) {
            const combineItemsField = key
            const combineItemsFieldData = combineItemsData[combineItemsField]
            const numCombineItem = combineItemsField.split('combineItems')[1]
            if (numCombineItem > 1) {
                for (let key in combineItemsFieldData) {
                    console.log("5.1 combineItemsFieldData----", combineItemsFieldData)
                    const combineItem = key
                    const combineItemData = combineItemsFieldData[combineItem]
                    console.log("5.2 combineItemData----", combineItemData)
                    let combineItemDataWithPID = []
                    console.log("5.3 nextPrimaryItemsIdData----", nextPrimaryItemsIdData)
                    for (let item of combineItemData) {
                        console.log("5.4 item in combineItemData----", item)
                        const primaryItemId = { primaryId: nextPrimaryItemsIdData[item] }
                        combineItemDataWithPID = [...combineItemDataWithPID, primaryItemId]
                    }
                    combineItemsFieldData[combineItem] = combineItemDataWithPID
                }
            }
            console.log(`6 combineItemData ${combineItemsField} AFT----`, combineItemsData[combineItemsField])
            nextPrimaryItemsIdData = await createCombineItem(combineItemsFieldData)
        }



        // let combineItemsCreatingOrder = []
        // const productOptionalsCreating = req.body.types.map(type => {
        //     const items = req.body[`${type}/items`]
        //     const itemData = Array.isArray(items) ? items : [items]

        //     let combineItemsCreatingTypeMap = []
        //     const productOptionalPromise = async () => {
        //         const productOptionalType = await prisma.productOptionalType.create(
        //             {
        //                 data: {
        //                     title: type,
        //                     productId: product.id,
        //                 }
        //             }
        //         )

        //         const productOptionalItemCreating = itemData.map(item => {
        //             const fileItem = req.files.length && objectFile[`${type}-${item}/image`]
        //             // const combineItemTotal = req.body.types.reduce((allTypes, type) => {
        //             //     allTypes[type] = 0
        //             //     return allTypes
        //             // }, {})
        //             let combineItemTotal = { total: 0 }
        //             let combineItemTotalTemp = {}
        //             for (let key in req.body) {
        //                 console.log('97 key ', key)
        //                 const combineItemNum = key.split('/combineItems')[1]
        //                 if (combineItemNum) {
        //                     combineItemTotal[`combineItems${combineItemNum}`] = {}
        //                     console.log("100 combinItemNum ", combineItemNum)
        //                     if (combineItemNum > combineItemTotal.total) {
        //                         combineItemTotal.total = +combineItemNum
        //                     }
        //                 }
        //                 if (key === 'types') {
        //                     combineItemTotalTemp[`combineItems1`] = req.body[key].reduce((allTypes, type) => {
        //                         allTypes[type] = 0
        //                         return allTypes
        //                     }, {})
        //                 }
        //                 if (key.endsWith('/items')) {
        //                     console.log('112 dsadas ', req.body[key])
        //                     combineItemTotalTemp[`combineItems2`] = { ...combineItemTotalTemp[`combineItems2`] }
        //                     const allItems = Array.isArray(req.body[key]) ? [...req.body[key]] : [req.body[key]]
        //                     console.log(allItems)
        //                     allItems.forEach((item) => combineItemTotalTemp[`combineItems2`][item] = 0)
        //                     console.log('118 combineItemTotalTemp', combineItemTotalTemp)
        //                 }
        //                 if (key.endsWith(`combineItems${combineItemNum}`)) {
        //                     // console.log("112 welcome key === `combineItems${combineItemNum")
        //                     // if (combineItemNum == 1) {
        //                     // console.log("114 welcome combineItemNum == 1")
        //                     console.log('123 combineItemNum ', combineItemNum)
        //                     console.log('124 key ', key)
        //                     let combineItemTotalGroup
        //                     switch (+combineItemNum) {
        //                         case 1:
        //                             const type = key.split('-')[0]
        //                             combineItemTotalGroup = type
        //                             break
        //                         default:
        //                             const primaryItems = key.split('+')
        //                             combineItemTotalGroup = primaryItems.find((item) => item)
        //                             break
        //                     }
        //                     console.log('132 combineItemTotalGroup ', combineItemTotalGroup)
        //                     // console.log("116 combineItemType ", combineItemType)
        //                     if (combineItemTotalGroup in combineItemTotalTemp[`combineItems${combineItemNum}`]) {
        //                         const increase = Array.isArray(req.body[key]) ? req.body[key].length : 1
        //                         combineItemTotalTemp[`combineItems${combineItemNum}`][combineItemTotalGroup] += increase
        //                     }
        //                     // }
        //                 }
        //             }

        //             for (let key in combineItemTotal) {
        //                 if (combineItemTotalTemp[key]) {
        //                     combineItemTotal[key] = combineItemTotalTemp[key]
        //                 }
        //             }

        //             console.log('120 combineItemTotal Before', combineItemTotal)
        //             console.log('121 combineItemTotalTemp', combineItemTotalTemp)
        //             console.log('122 combineItemTotal After', combineItemTotal)
        //             console.log(`123 combineItemTotal/${type}/${item}}`, combineItemTotal['combineItems1'][type])
        //             // for (let key in req.body) {
        //             //     const combineItemType = key.endsWith('/combineItems') && key.split('-')[0]
        //             //     if (combineItemType in combineItemTotal) {
        //             //         const increase = Array.isArray(req.body[key]) ? req.body[key].length : 1
        //             //         combineItemTotal[combineItemType] += increase
        //             //     }
        //             // }

        //             // console.log(combineItemTotal)

        //             const combineItemData = genDBManyData(req.body[`${type}-${item}/combineItems1`], 'title')
        //             // let combineItemData = {}
        //             // for (let i = 1; i <= combineItemTotal.total; i++) {
        //             //     combineItemData[`combineItems${i}`] = i === 1 &&
        //             //         genDBManyData(req.body[`${type}-${item}/combineItems${i}`], 'title')


        //             // }

        //             console.log("81-type ", type)
        //             console.log("82-item ", item)
        //             console.log("83-combineItemData ", combineItemData)

        //             const primaryItemData = {
        //                 title: item,
        //                 productId: product.id,
        //                 optionalTypeItems: {
        //                     create: {
        //                         productOptionalTypeId: productOptionalType.id
        //                     }
        //                 }
        //             }

        //             if (fileItem) {
        //                 primaryItemData.images = {
        //                     create: {
        //                         productId: product.id,
        //                         src: objectFile[`${type}-${item}/image`][0],
        //                     }
        //                 }
        //             }

        //             const productItemPromise = async () => {
        //                 const primaryItem = await prisma.productOptionalItem.create({
        //                     data: primaryItemData,
        //                     include: {
        //                         images: true
        //                     }
        //                 })


        //                 //##################################################
        //                 let countCombineItems = 1
        //                 const comBineItemCreateFn = (combineItemData, primaryId) => {
        //                     if (countCombineItems > combineItemTotal.total) {
        //                         return
        //                     }
        //                     const combineItemsCreatingMap = combineItemData.map((itemCombine) => {
        //                         const combineItemsCreating = async () => {
        //                             const isExistCombineItem = await prisma.productOptionalItem.findFirst({
        //                                 where: {
        //                                     title: itemCombine.title,
        //                                     productId: product.id
        //                                 }
        //                             })

        //                             console.log("131 dasdwww ", isExistCombineItem)

        //                             if (isExistCombineItem) {
        //                                 const updateCombieItem = await prisma.combineOptionalItem.create({
        //                                     data: {
        //                                         primaryId: primaryId,
        //                                         combineId: isExistCombineItem.id,
        //                                     }
        //                                 })
        //                                 console.log("187 asdnaskjdha ", updateCombieItem)
        //                                 return updateCombieItem
        //                             }

        //                             const combineItem = await prisma.productOptionalItem.create({
        //                                 data: {
        //                                     title: itemCombine.title,
        //                                     productId: product.id,
        //                                     combineItem: {
        //                                         create: {
        //                                             primaryId: primaryId,
        //                                         }
        //                                     },
        //                                 }
        //                             })

        //                             countCombineItems++
        //                             console.log(`208 combineItem/${type}/${item} `, combineItem)
        //                             if (combineItem) {
        //                                 const combineSubItemData = genDBManyData(req.body[`${itemCombine.title}/combineItems${countCombineItems}`], 'title')

        //                                 comBineItemCreateFn(combineSubItemData, combineItem.id)
        //                             }

        //                             return combineItem
        //                         }

        //                         return combineItemsCreating
        //                     }
        //                     )

        //                     if (countCombineItems > 1) {
        //                         const combineItemsCreating = async () => {
        //                             const combineItemsCreatingCall = combineItemsCreatingMap.map((fn) => fn())
        //                             return await Promise.all(combineItemsCreatingCall)
        //                         }

        //                         combineItemsCreating()
        //                     }
        //                     console.log(`224 combineItemsCreatingMap/${type}/${item}}`, combineItemsCreatingMap)
        //                     combineItemsCreatingTypeMap = [...combineItemsCreatingTypeMap, ...combineItemsCreatingMap]
        //                     console.log(`227 combineItemsCreatingTypeMap/${type}/${item}}`, combineItemsCreatingTypeMap)
        //                     console.log(`243 combineItemTotal/${type}}`, combineItemTotal['combineItems1'][type])
        //                     console.log(`244 combineItemsCreatingTypeMap.length/${type}}`, combineItemsCreatingTypeMap.length)
        //                     console.log(`245 combineItemsCreatingTypeMap.length === combineItemTotal/${type}}`, combineItemsCreatingTypeMap.length === combineItemTotal['combineItems1'][type])
        //                     if (combineItemsCreatingTypeMap.length === combineItemTotal['combineItems1'][type]) {
        //                         const combineItemsCreatingType = async () => {
        //                             const combineItemsCreatingTypeMapCall = combineItemsCreatingTypeMap.map((fn) => fn())
        //                             console.log(`249 combineItemsCreatingTypeMapCall/${type}/${item}`, combineItemsCreatingTypeMapCall)
        //                             return await Promise.all(combineItemsCreatingTypeMapCall)
        //                         }
        //                         console.log(`252 combineItemsCreatingType/${type}/${item}}`, combineItemsCreatingType)
        //                         combineItemsCreatingOrder = [...combineItemsCreatingOrder, combineItemsCreatingType]
        //                         console.log(`254 combineItemsCreatingOrder/${type}/${item}}`, combineItemsCreatingOrder)
        //                     }
        //                     const combineItemsCreatingOrderCall = combineItemsCreatingOrder.length === req.body.types.length &&
        //                         combineItemsCreatingOrder.reduce((fn, pmAll) => {
        //                             console.log(`259 fn/${type}/${item}}`, fn)
        //                             console.log(`260 pmAll/${type}/${item}}`, pmAll)
        //                             console.log(`261 (typeof fn) === 'function'/${type}/${item}}`, (typeof fn) === 'function')
        //                             return (typeof fn) === 'function' ? fn().then(() => pmAll()) : fn.then(() => pmAll())
        //                         })
        //                     console.log(`263 combineItemsCreatingOrderCall/${type}/${item}} `, combineItemsCreatingOrderCall)
        //                 }
        //                 // #######################################
        //                 // const combineItemsCreatingMap = combineItemData.map((itemCombine) => {
        //                 //     const combineItemsCreating = async () => {
        //                 //         console.log("122-asdsa;das;ka;ldk ", item)
        //                 //         const isExistCombineItem = await prisma.productOptionalItem.findFirst({
        //                 //             where: {
        //                 //                 title: itemCombine.title,
        //                 //                 productId: product.id
        //                 //             }
        //                 //         })

        //                 //         console.log("131 dasdwww ", isExistCombineItem)

        //                 //         if (isExistCombineItem) {
        //                 //             const updateCombieItem = await prisma.combineOptionalItem.create({
        //                 //                 data: {
        //                 //                     primaryId: primaryItem.id,
        //                 //                     combineId: isExistCombineItem.id,
        //                 //                 }
        //                 //             })
        //                 //             console.log("187 asdnaskjdha ", updateCombieItem)
        //                 //             return updateCombieItem
        //                 //         }

        //                 //         const combineItem = await prisma.productOptionalItem.create({
        //                 //             data: {
        //                 //                 title: itemCombine.title,
        //                 //                 productId: product.id,
        //                 //                 combineItem: {
        //                 //                     create: {
        //                 //                         primaryId: primaryItem.id,
        //                 //                     }
        //                 //                 },
        //                 //                 optionalTypeItems: {
        //                 //                     create: {
        //                 //                         productOptionalTypeId: productOptionalType.id
        //                 //                     }
        //                 //                 }
        //                 //             }
        //                 //         })

        //                 //         console.log(`208 combineItem/${type}/${item} `, combineItem)

        //                 //         return combineItem
        //                 //     }

        //                 //     return combineItemsCreating

        //                 //     // return combineItemsCreating
        //                 // }
        //                 // )

        //                 // console.log(`224 combineItemsCreatingMap/${type}/${item}}`, combineItemsCreatingMap)
        //                 // combineItemsCreatingTypeMap = [...combineItemsCreatingTypeMap, ...combineItemsCreatingMap]
        //                 // console.log(`227 combineItemsCreatingTypeMap/${type}/${item}}`, combineItemsCreatingTypeMap)
        //                 // console.log(`243 combineItemTotal/${type}}`, combineItemTotal[type])
        //                 // console.log(`244 combineItemsCreatingTypeMap.length/${type}}`, combineItemsCreatingTypeMap.length)
        //                 // console.log(`245 combineItemsCreatingTypeMap.length === combineItemTotal/${type}}`, combineItemsCreatingTypeMap.length === combineItemTotal[type])
        //                 // if (combineItemsCreatingTypeMap.length === combineItemTotal[type]) {
        //                 //     const combineItemsCreatingType = async () => {
        //                 //         const combineItemsCreatingTypeMapCall = combineItemsCreatingTypeMap.map((fn) => fn())
        //                 //         console.log(`249 combineItemsCreatingTypeMapCall/${type}/${item}`, combineItemsCreatingTypeMapCall)
        //                 //         return await Promise.all(combineItemsCreatingTypeMapCall)
        //                 //     }
        //                 //     console.log(`252 combineItemsCreatingType/${type}/${item}}`, combineItemsCreatingType)
        //                 //     combineItemsCreatingOrder = [...combineItemsCreatingOrder, combineItemsCreatingType]
        //                 //     console.log(`254 combineItemsCreatingOrder/${type}/${item}}`, combineItemsCreatingOrder)
        //                 // }
        //                 // const combineItemsCreatingOrderCall = combineItemsCreatingOrder.length === req.body.types.length &&
        //                 //     combineItemsCreatingOrder.reduce((fn, pmAll) => {
        //                 //         console.log(`259 fn/${type}/${item}}`, fn)
        //                 //         console.log(`260 pmAll/${type}/${item}}`, pmAll)
        //                 //         console.log(`261 (typeof fn) === 'function'/${type}/${item}}`, (typeof fn) === 'function')
        //                 //         return (typeof fn) === 'function' ? fn().then(() => pmAll()) : fn.then(() => pmAll())
        //                 //     })
        //                 // console.log(`263 combineItemsCreatingOrderCall/${type}/${item}} `, combineItemsCreatingOrderCall)
        //                 //##################################################
        //                 // #######################################

        //                 comBineItemCreateFn(combineItemData, primaryItem.id)

        //                 const result = { primaryItem }

        //                 return result
        //             }
        //             return productItemPromise()
        //         })

        //         // productOptionalType.items = productOptionalItem
        //         return productOptionalType
        //     }

        //     return productOptionalPromise()
        // })

        // const productOptionals = await Promise.all(productOptionalsCreating)
        // console.log("297 combineItemsCreatingOrder", combineItemsCreatingOrder)

        // const respond = { product, productOptionals }
        const respond = { product }
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