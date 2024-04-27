const { rateLimit } = require('express-rate-limit')

module.exports = rateLimit({
    windowMs: 60 * 1000,
    limit: 150,
    message: { message: 'Too many request from this IP' }
})