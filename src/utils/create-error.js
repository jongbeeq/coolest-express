module.exports = (message, statusCode, atColumn) => {
    const error = new Error(message)
    error.atColumn = atColumn
    error.statusCode = statusCode
    return error
}