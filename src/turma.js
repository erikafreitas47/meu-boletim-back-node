const express = require('express');
const validaLogin = require('./validaLogin');
const pool = require('./pool-connect');

const router = express.Router();

router.get('/', async (req, res) => {
  // #swagger.tags = ['Turmas']
  // #swagger.summary = 'Retorna uma lista de turmas'
  if (!await validaLogin(req, ['SECRETARIA', 'PROFESSOR', 'RESPONSAVEL', 'ALUNO'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({
        msg: 'Conexão não autorizada',
        error: err.message,
      });
    }
    return client.query('SELECT * FROM turma ORDER BY serie, nome', (error, result) => {
      if (error) {
        release();
        return res.status(401).send({
          msg: 'Falha ao conectar no banco',
          error: error.message,
        });
      }
      release();
      return res.status(200).send(result.rows.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        anoLetivo: turma.ano_letivo,
        turno: turma.turno,
        serie: turma.serie,
      })));
    });
  });
});

router.get('/:id', async (req, res) => {
  // #swagger.tags = ['Turmas']
  // #swagger.summary = 'Procura turma por id'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({
        msg: 'Conexão não autorizada.',
        error: err.message,
      });
    }

    const sql = 'select * from turma where id = $1';
    const valor = [req.params.id];

    return client.query(sql, valor, (error, result) => {
      if (error) {
        release();
        return res.status(401).send({
          msg: 'Operação não autorizada.',
          error: error.message,
        });
      }
      const turma = result.rows[0];
      release();
      return res.status(200).send({
        id: turma.id,
        nome: turma.nome,
        anoLetivo: turma.ano_letivo,
        turno: turma.turno,
        serie: turma.serie,
      });
    });
  });
});

router.post('/', async (req, res) => {
  // #swagger.tags = ['Turmas']
  // #swagger.summary = 'Salva ou edita uma nova turma'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({
        msg: 'Conexão não autorizada.',
        error: err.message,
      });
    }

    const {
      nome, anoLetivo, turno, serie, id,
    } = req.body;

    if (id) {
      return client.query('update turma set nome=$1, ano_letivo=$2, turno=$3, serie=$4 where id=$5', [nome, anoLetivo, turno, serie, id], (erro) => {
        if (erro) {
          release();
          return res.status(401).send({
            msg: 'Operação não autorizada',
            error: erro.message,
          });
        }
        release();
        return res.status(200).send({ msg: 'Registro alterado com sucesso.' });
      });
    }
    return client.query('select * from turma where nome = $1 and ano_letivo = $2 and serie = $3', [nome, anoLetivo, serie], (error, results) => {
      if (error) {
        release();
        return res.status(401).send({
          msg: 'Operação não autorizada.',
          error: error.message,
        });
      }
      if (results.rowCount > 0) {
        release();
        return res.status(403).send({ msg: 'Turma já cadastrada.' });
      }
      return client.query('insert into turma (nome, ano_letivo, turno, serie) values($1, $2, $3, $4)', [nome, anoLetivo, turno, serie], (error2) => {
        if (error2) {
          release();
          return res.status(401).send({
            msg: 'Operação não autorizada.',
            error: error2.message,
          });
        }
        release();
        return res.status(201).send({ msg: 'Dados registrados com sucesso.' });
      });
    });
  });
});

router.delete('/:id', async (req, res) => {
  // #swagger.tags = ['Turmas']
  // #swagger.summary = 'Deleta uma turma cadastrada'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({
        msg: 'Conexão não autorizada.',
        erro: err.message,
      });
    }
    return client.query('delete from turma where id = $1', [req.params.id], (erro) => {
      if (erro) {
        release();
        return res.status(401).send({
          msg: 'Não é possível excluir uma turma que está em uso',
          erro: erro.message,
        });
      }
      release();
      return res.status(200).send({ msg: 'Registro excluído com sucesso.' });
    });
  });
});

module.exports = router;
