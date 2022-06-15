const bcrypt = require('bcrypt');

const encriptador = (app) => {
  app.post('/encript', (req, res) => {
    bcrypt.hash(req.body.text, 10, (error, hash) => {
      res.status(200).send({ hash });
    });
  });
};

module.exports = encriptador;
