const { errorUnAuthenticatedMessage } = require("../config/constant")
const createError = require("../utils/create-error")
const jwt = require('jsonwebtoken')
const prisma = require('../models/prisma')

module.exports = async (req, res, next) => {
    try {
        const unauthenticateError = createError(errorUnAuthenticatedMessage, 401)
        const authorization = req.headers.authorization

        if (!authorization || !authorization.startsWith('Bearer ')) {
            next(unauthenticateError)
        }

        const token = authorization.split('Bearer ')[1]

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY || 'sjkbdsakdbaskjdbaskb')

        const admin = await prisma.admin.findUnique({
            where: {
                id: payload.id
            }
        })

        // authenAdmin
        if (admin) {
            delete admin.password
            req.account = admin
            return next()
        }

        const user = await prisma.user.findUnique({
            where: {
                id: payload.id
            }
        })

        if (!user) {
            next(unauthenticateError)
        }

        delete user.password
        req.user = user
        next()
    } catch (error) {
        next(createError(error))
    }
}