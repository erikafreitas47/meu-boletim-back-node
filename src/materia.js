const express = require('express');
const validaLogin = require('./validaLogin');
const pool = require('./pool-connect');

const router = express.Router();

router.get('/', async (req, res) => {
  // #swagger.tags = ['Matérias']
  // #swagger.summary = 'Retorna uma lista de matérias'
  if (!await validaLogin(req, ['SECRETARIA', 'PROFESSOR', 'RESPONSAVEL', 'ALUNO'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
    const sql = 'select * from materia order by nome';
    return client.query(sql, (err2, result) => {
      if (err2) {
        release();
        return res.status(401).send({ msg: 'Não autorizado' });
      }
      release();
      return res.status(200).send(result.rows);
    });
  });
});

router.get('/:id', async (req, res) => {
  // #swagger.tags = ['Matérias']
  // #swagger.summary = 'Procura matéria por id'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
    return client.query('select * from materia where id = $1', [req.params.id], (err2, result) => {
      if (err2) {
        release();
        return res.status(401).send({ msg: 'Não encontrado' });
      }
      release();
      return res.status(200).send(result.rows[0]);
    });
  });
});

router.post('/', async (req, res) => {
  // #swagger.tags = ['Matérias']
  // #swagger.summary = 'Salva ou edita uma nova matéria'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
    const { nome, id } = req.body;
    if (id) {
      return client.query('update materia set nome=$1 where id = $2', [nome, id], (err2) => {
        if (err2) {
          release();
          return res.status(401).send({ msg: 'Não foi possível alterar' });
        }
        release();
        return res.status(200).send({ msg: 'Alterado com sucesso' });
      });
    }
    return client.query('select * from materia where nome = $1', [nome], (err2, result) => {
      if (err2) {
        release();
        return res.status(401).send({ msg: 'Não autorizado' });
      }
      if (result.rowCount > 0) {
        release();
        return res.status(403).send({ msg: 'Matéria já cadastrada' });
      }
      return client.query('insert into materia(nome) values($1)', [nome], (err3) => {
        if (err3) {
          release();
          return res.status(401).send({ msg: 'Não foi possível salvar' });
        }
        release();
        return res.status(201).send({ msg: 'Salvo com sucesso' });
      });
    });
  });
});

router.delete('/:id', async (req, res) => {
  // #swagger.tags = ['Matérias']
  // #swagger.summary = 'Deleta uma matéria cadastrada'
  if (!await validaLogin(req, ['SECRETARIA'])) {
    return res.status(403).send({ msg: 'Usuário não autorizado' });
  }
  return pool.connect((err, client, release) => {
    if (err) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
    return client.query('delete from materia where id = $1', [req.params.id], (err2) => {
      if (err2) {
        release();
        return res.status(400).send({ msg: 'Não é possível excluir uma matéria em uso.' });
      }
      release();
      return res.status(200).send({ msg: 'Excluído com sucesso' });
    });
  });
});

module.exports = router;
