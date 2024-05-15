const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public')
    },
    filename: (req, file, cb) => {
        // console.dir(req.files)
        // console.dir(req.body)
        // console.dir(file)
        const split = file.originalname.split('.')
        const ext = split[split.length - 1]
        const randomName = Date.now() + Math.round(Math.random() * 1000000)
        const fileName = randomName + "." + ext
        cb(null, fileName)
    }
})


module.exports = upload = multer({ storage: storage })