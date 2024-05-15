const cloudinary = require('../config/cloudinary')

exports.uploadToCloud = async (path, type) => {
    const result = await cloudinary.uploader.upload(path, { resource_type: type })
    return result.secure_url
}