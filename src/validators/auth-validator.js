const Joi = require('joi')

exports.registerSchema = Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/),
    password: Joi.string().pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])[a-zA-Z0-9#?!@$%^&*-]{6,}$/).trim().required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).trim().required().strip(),
    address: Joi.string().trim().required(),
})

exports.loginSchema = Joi.object({
    emailOrMobile: Joi.alternatives([Joi.string().email().required(), Joi.string().pattern(/^[0-9]{10}$/)]).required().strip(),
    password: Joi.string().pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])[a-zA-Z0-9#?!@$%^&*-]{6,}$/).trim().required(),
    email: Joi.forbidden().when('emailOrMobile', {
        is: Joi.string().email().required(),
        then: Joi.string().default(Joi.ref('emailOrMobile')),
    }),
    mobile: Joi.forbidden().when('emailOrMobile', {
        is: Joi.string().pattern(/^[0-9]{10}$/),
        then: Joi.string().default(Joi.ref('emailOrMobile')),
    })
})