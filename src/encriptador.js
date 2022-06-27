const bcrypt = require('bcrypt');
const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  bcrypt.hash(req.body.text, 10, (_, hash) => {
    res.status(200).send({ hash });
  });
});

module.exports = router;
