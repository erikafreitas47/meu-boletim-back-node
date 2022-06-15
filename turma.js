const endpointTurmas = (app, pool) => {
  app.get('/turmas', (req, res) => {
    // #swagger.tags = ['Turmas']
    // #swagger.summary = 'Retorna uma lista de turmas'
    pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({
          mensagem: 'Conexão não autorizada',
          error: err.message,
        });
      }
      client.query('SELECT * FROM turma ORDER BY nome', (error, result) => {
        if (error) {
          release();
          return res.status(401).send({
            mensagem: 'Falha ao conectar no banco',
            error: error.message,
          });
        }
        res.status(200).send(result.rows.map((turma) => ({
          id: turma.id,
          nome: turma.nome,
          anoLetivo: turma.ano_letivo,
          turno: turma.turno,
          serie: turma.serie,
        })));
        release();
      });
    });
  });

  app.get('/turmas/:id', (req, res) => {
    // #swagger.tags = ['Turmas']
    // #swagger.summary = 'Procura turma por id'
    pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({
          mensagem: 'Conexão não autorizada.',
          error: err.message,
        });
      }

      const sql = 'select * from turma where id = $1';
      const valor = [req.params.id];

      client.query(sql, valor, (error, result) => {
        if (error) {
          release();
          return res.status(401).send({
            mensagem: 'Operação não autorizada.',
            error: error.message,
          });
        }
        const turma = result.rows[0];
        res.status(200).send({
          id: turma.id,
          nome: turma.nome,
          anoLetivo: turma.ano_letivo,
          turno: turma.turno,
          serie: turma.serie,
        });
        release();
      });
    });
  });

  app.post('/turmas', (req, res) => {
    // #swagger.tags = ['Turmas']
    // #swagger.summary = 'Salva ou edita uma nova turma'
    pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({
          mensagem: 'Conexão não autorizada.',
          error: err.message,
        });
      }

      const {
        nome, ano_letivo, turno, serie, id,
      } = req.body;

      if (id) {
        client.query('update turma set nome=$1, ano_letivo=$2, turno=$3, serie=$4 where id=$5', [nome, ano_letivo, turno, serie, id], (erro, result) => {
          if (erro) {
            release();
            return res.status(401).send({
              mensagem: 'Operação não autorizada',
              error: erro.message,
            });
          }
          res.status(200).send({ mensagem: 'Registro alterado com sucesso.' });
          release();
        });
      } else {
        client.query('select * from turma where nome = $1', [nome], (error, results) => {
          if (error) {
            release();
            return res.status(401).send({
              mensagem: 'Operação não autorizada.',
              error: error.message,
            });
          }
          if (results.rowCount > 0) {
            release();
            return res.status(403).send({ mensagem: 'Turma já cadastrada.' });
          }
          client.query('insert into turma (nome, ano_letivo, turno, serie) values($1, $2, $3, $4)', [nome, ano_letivo, turno, serie], (error2, results2) => {
            if (error2) {
              release();
              return res.status(401).send({
                mensagem: 'Operação não autorizada.',
                error: error2.message,
              });
            }
            release();
            res.status(201).send({ mensagem: 'Dados registrados com sucesso.' });
          });
        });
      }
    });
  });

  app.delete('/turmas/:id', (req, res) => {
    // #swagger.tags = ['Turmas']
    // #swagger.summary = 'Deleta uma turma cadastrada'
    pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({
          mensagem: 'Conexão não autorizada.',
          erro: err.message,
        });
      }
      client.query('delete from turma where id = $1', [req.params.id], (erro, result) => {
        if (erro) {
          release();
          return res.status(401).send({
            mensagem: 'Operação não autorizada.',
            erro: erro.message,
          });
        }
        release();
        res.status(200).send({ mensagem: 'Registro excluído com sucesso.' });
      });
    });
  });
};

module.exports = endpointTurmas;
