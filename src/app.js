require('dotenv').config()
const express = require('express');
const morgan = require('morgan');
const cors = require('cors')

const rateLimitMiddleware = require('./middlewares/rate-limit')
const authRoute = require('./routes/auth-route')

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(rateLimitMiddleware)
app.use(express.json())

app.use('/auth', authRoute)

app.use((req, res, next) => {
    res.status(404).json({ message: 'path not found' })
})

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, console.log('Server runnig on port ' + PORT))