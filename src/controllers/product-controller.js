const { uploadToCloud } = require('../utils/cloudinary-service')
const fs = require('fs/promises')
const createError = require('../utils/create-error')

exports.createProduct = async (req, res, next) => {
    try {
        const uploadingFiles = req.files.map(file => {
            const type = file.mimetype.split('/')[0]
            return uploadToCloud(file.path, type)
        })

        const allFiles = await Promise.all(uploadingFiles)


        // console.log(allFiles)

        // res.status(200).json(allFiles)
        res.status(200).json(req.body)
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