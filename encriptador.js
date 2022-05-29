const bcrypt = require('bcrypt')

let encriptador = (app) => {

    app.post('/encript', (req, res) =>{
        bcrypt.hash(req.body.text, 10, (error, hash) => {
            res.status(200).send({hash})
        })
    })
}

module.exports = encriptador