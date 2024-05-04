const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { errorEmailIsExistMessage, errorLoginMessage } = require('../config/constant')
const prisma = require('../models/prisma')
const createError = require('../utils/create-error')
const { registerSchema, loginSchema } = require('../validators/auth-validator')

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
            return next(createError(errorEmailIsExistMessage, 400, 'email'))
        }

        value.password = await bcrypt.hash(value.password, 12)

        const user = await prisma.user.create({
            data: { ...value, mobile: value.mobile }
        })

        const payload = { id: user.id }

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRE }
        )

        delete user.password
        const respond = { accessToken, user }

        res.status(200).json(respond)
    } catch (err) {
        next(err)
    }
}

exports.login = async (req, res, next) => {
    try {
        const { value, error } = loginSchema.validate(req.body)
        const { email, mobile, password } = value
        const credentialError = createError(errorLoginMessage, 400)

        if (error) {
            return next(credentialError)
        }

        const loginData = email ? { email } : { mobile }
        console.log(loginData)
        const user = await prisma.user.findUnique({
            where: loginData
        })

        if (!user) {
            return next(credentialError)
        }
        console.log(user)

        const rightPassword = await bcrypt.compare(password, user.password)

        console.log(rightPassword)

        if (!rightPassword) {
            return next(credentialError)
        }

        delete user.password

        console.log(user)
        const payload = { id: user.id }
        console.log(payload)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY || 'asdbsadbashdbsajd', { expiresIn: process.env.JWT_EXPIRE })
        console.log(accessToken)
        const respond = { user, accessToken }
        res.status(200).json(respond)
    } catch (error) {
        next(error)
    }
}