const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { errorEmailIsExistMessage } = require('../config/constant')
const prisma = require('../models/prisma')
const createError = require('../utils/create-error')
const { registerSchema } = require('../validators/auth-validator')

exports.register = async (req, res, next) => {
    try {
        console.log(req.body)
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

        value.password = await bcrypt.hash(value.password, 12)

        const user = await prisma.user.create({
            data: { ...value, mobile: +value.mobile }
        })

        const payload = { id: user.id }

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRE }
        )

        const respond = { accessToken: accessToken }

        res.status(200).json(respond)
    } catch (err) {
        next(err)
    }
}