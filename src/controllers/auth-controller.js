const { errorEmailIsExistMessage } = require('../config/constant')
const prisma = require('../models/prisma')
const createError = require('../utils/create-error')
const { registerSchema } = require('../validators/auth-validator')

exports.register = async (req, res, next) => {
    try {
        const { value, error } = registerSchema.validate(req.body, { abortEarly: false })
        if (error) {
            return next(createError(error?.message, 400))
        }
        const isExistEmail = await prisma.user.findUnique({
            where: {
                email: value.email
            }
        })

        if (isExistEmail) {
            return next(createError(errorEmailIsExistMessage, 400))
        }


        console.log(isExistEmail)

    } catch (err) {
        next(err)
    }
}