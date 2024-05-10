const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { errorEmailIsExistMessage, errorLoginMessage } = require('../config/constant')
const prisma = require('../models/prisma')
const createError = require('../utils/create-error')
const { registerUserSchema, registerAdminSchema, loginSchema } = require('../validators/auth-validator')

exports.registerUser = async (req, res, next) => {
    try {
        console.log(req.body)
        const { value, error } = registerUserSchema.validate(req.body, { abortEarly: false })

        console.log("a.sadasd", value)
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
            data: { ...value }
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

exports.registerAdmin = async (req, res, next) => {
    try {
        console.log('welcome regAdmin')
        console.log(req.body)
        const { value, error } = registerAdminSchema.validate(req.body, { abortEarly: false })
        if (error) {
            return next(createError(error?.message, 400))
        }
        const isExistEmail = await prisma.admin.findUnique({
            where: {
                email: value.email
            }
        })

        if (isExistEmail) {
            return next(createError(errorEmailIsExistMessage, 400, 'email'))
        }

        value.password = await bcrypt.hash(value.password, 12)

        const admin = await prisma.admin.create({
            data: { ...value }
        })

        const payload = { id: admin.id }

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRE }
        )

        delete admin.password
        admin.isAdmin = true
        const respond = { accessToken, admin }

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
        console.log('logindata ', loginData)

        const admin = await prisma.admin.findUnique({
            where: loginData
        })

        let account = admin

        if (!admin) {
            const user = await prisma.user.findUnique({
                where: loginData
            })

            console.log(user)

            if (!user) {
                return next(credentialError)
            }

            account = user
        }

        console.log(account)

        const rightPassword = await bcrypt.compare(password, account.password)

        console.log('rightPassword', rightPassword)

        if (!rightPassword) {
            console.log(rightPassword)
            return next(credentialError)
        }

        delete account.password

        console.log(account)
        const payload = { id: account.id }
        console.log(payload)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY || 'asdbsadbashdbsajd', { expiresIn: process.env.JWT_EXPIRE })
        console.log(accessToken)
        const respond = { account, accessToken }
        res.status(200).json(respond)
    } catch (error) {
        next(error)
    }
}

exports.getMe = (req, res) => {
    const respond = { account: req.account }
    res.status(200).json(respond)
}