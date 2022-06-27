const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./pool-connect');

const router = express.Router();

router.post('/', (request, response) => {
  // #swagger.tags = ['Pessoas']
  // #swagger.summary = 'Autentica usuário'
  pool.connect((err, client, release) => {
    if (err) {
      return response.status(401).send({ msg: 'Conexão não autorizada' });
    }

    return client.query('select * from pessoa where login = $1', [request.body.login], (error, result) => {
      if (error) {
        release();
        return response.status(401).send(
          {
            msg: 'Operação não permitida',
            error: error.message,
          },
        );
      }

      if (result.rowCount > 0) {
        return bcrypt.compare(request.body.senha, result.rows[0].senha, (error2, results) => {
          if (error2 || !results) {
            release();
            return response.status(401).send({
              msg: 'Falha na autenticação',
            });
          }

          const token = jwt.sign(
            {
              email: result.rows[0].email,
              login: result.rows[0].login,
              id: result.rows[0].id,
            },
            process.env.JWTKEY,
            { expiresIn: '12h' },
          );

          const body = {
            msg: 'Conectado com sucesso',
            id: result.rows[0].id,
            nome: result.rows[0].nome,
            tipoPessoa: result.rows[0].tipo_pessoa,
            token,
          };

          if (result.rows[0].tipo_pessoa === 'ALUNO') {
            return client.query(
              `select t.serie, t.turno, t.nome from matricula m  
                                 inner join turma t on m.turma = t.id where m.id=$1`,
              [result.rows[0].id],
              (_, resultTurma) => {
                body.serie = resultTurma.rows[0].serie;
                body.turma = resultTurma.rows[0].nome;
                body.turno = resultTurma.rows[0].turno;
                release();
                return response.status(200).send(body);
              },
            );
          }
          release();
          return response.status(200).send(body);
        });
      }
      release();
      return response.status(400).send({
        msg: 'Usuário não encontrado',
      });
    });
  });
});

module.exports = router;
