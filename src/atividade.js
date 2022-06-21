const { calculoNotas } = require('./calculos');

const endpointAtividade = (app, pool) => {
  app.get('/listar-atividades', (req, res) => {
    // #swagger.tags = ['Notas']
    // #swagger.summary = 'Retorna uma lista de atividades por turma e por matéria'
    const { turmaId, materiaId } = req.query;
    if (!turmaId || !materiaId) {
      return res.status(401).send({ msg: 'Informe turma e materia' });
    }
    return pool.connect((err, client, release) => {
      if (err) {
        release();
        return res.status(401).send({ msg: 'Conexão não autorizada' });
      }
      return client.query(
        'select * from atividade where materia = $1 and turma = $2 order by data_atividade desc',
        [materiaId, turmaId],
        (err2, resultAtiv) => {
          if (err2) {
            release();
            return res.status(401).send({ msg: 'Não autorizado' });
          }
          release();
          return res.status(200).send(resultAtiv.rows.map((ativ) => ({
            id: ativ.id,
            data: ativ.data_atividade,
            tipo: ativ.tipo_atividade,
          })));
        },
      );
    });
  });

  app.delete('/atividade', (req, res) => {
    // #swagger.tags = ['Notas']
    // #swagger.summary = 'Deleta uma nota e após deleta uma atividade'
    const { atividadeId } = req.query;
    if (!atividadeId) {
      return res.status(401).send({ msg: 'Informe atividade' });
    }
    return pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({ msg: 'Conexão não autorizada' });
      }
      return client.query('delete from nota where atividade = $1', [atividadeId], (err2) => {
        if (err2) {
          release();
          return res.status(404).send({ msg: 'Nota não existe' });
        }
        return client.query('delete from atividade where id = $1', [atividadeId], (err3) => {
          if (err3) {
            release();
            return res.status(404).send({ msg: 'Atividade não existe' });
          }
          release();
          return res.status(200).send({ msg: 'Excluído com sucesso' });
        });
      });
    });
  });

  app.get('/buscar-nota', (req, res) => {
    // #swagger.tags = ['Notas']
    // #swagger.summary = 'Retorna uma lista de notas por turma e por matéria'
    const { atividadeId, turmaId } = req.query;
    if ((atividadeId && turmaId) || (!atividadeId && !turmaId)) {
      return res.status(401).send({ msg: 'Informe apenas atividade ou apenas turma' });
    }
    return pool.connect((err, client, release) => {
      if (err) {
        return res.status(401).send({ msg: 'Conexão não autorizada' });
      }
      if (atividadeId) {
        return client.query('select * from atividade where  id = $1', [atividadeId], (err2, resultAtiv) => {
          if (err2) {
            release();
            return res.status(404).send({ msg: 'Não autorizado' });
          }
          const atividade = resultAtiv.rows[0];
          return client.query(
            'select n.id notaId, p.id alunoId, * from nota n inner join pessoa p on n.aluno = p.id where n.atividade = $1',
            [atividadeId],
            (err3, resultNotas) => {
              if (err3) {
                release();
                return res.status(404).send({ msg: 'Não autorizado' });
              }
              release();
              return res.status(200).send({
                turma: { id: atividade.turma },
                dataAtividade: atividade.data_atividade,
                tipoAtividade: atividade.tipo_atividade,
                materia: { id: atividade.materia },
                notas: resultNotas.rows.map((n) => ({
                  aluno: { id: n.alunoid, nome: n.nome },
                  nota: n.nota,
                })),
              });
            },
          );
        });
      }
      return client.query(
        'select p.id alunoId, * from matricula m inner join pessoa p on p.id = m.id where m.turma = $1 order by nome',
        [turmaId],
        (err3, result) => {
          if (err3) {
            release();
            return res.status(404).send({ msg: 'Não autorizado' });
          }
          release();
          return res.status(200).send({
            turma: { id: turmaId },
            notas: result.rows.map((n) => ({
              aluno: { id: n.alunoid, nome: n.nome },
            })),
          });
        },
      );
    });
  });

  app.post('/salvar-atividade', (req, res) => {
    // #swagger.tags = ['Notas']
    // #swagger.summary = 'Salva ou edita uma atividade e após salva ou edita uma nota'
    const {
      atividadeId, turmaId, dataAtividade, tipoAtividade, materiaId, notas,
    } = req.body;
    const dataAtual = new Date();

    if (dataAtual <= new Date(dataAtividade)) {
      return res.status(400).send({ msg: 'Escolha uma data dentro do intervalo' });
    }
    return pool.connect((err, client, release) => {
      if (err) {
        return res.status(400).send({ msg: 'Falha na conexão' });
      }
      if (atividadeId) {
        return client.query(
          `update atividade set materia=$1, 
                data_atividade=$2, tipo_atividade=$3, turma=$4 where id=$5`,
          [materiaId, dataAtividade, tipoAtividade, turmaId, atividadeId],
          (err2) => {
            if (err2) {
              release();
              return res.status(401).send({ msg: 'Não foi possível alterar' });
            }
            const queries = [];
            notas.forEach((nota) => {
              queries.push(client.query(
                'update nota set nota=$1 where aluno=$2 and atividade=$3',
                [nota.nota, nota.alunoId, atividadeId],
              ));
            });
            return Promise.all(queries).then(() => {
              res.status(200).send({ msg: 'Alterado com sucesso' });
              calculoNotas(client, materiaId, notas.map((n) => n.alunoId), release);
            });
          },
        );
      }
      return client.query(
        `insert into atividade(materia, data_atividade, tipo_atividade,
                    turma) values($1, $2, $3, $4) returning id`,
        [materiaId, dataAtividade, tipoAtividade, turmaId],
        (err2, result) => {
          if (err2) {
            release();
            return res.status(401).send({ msg: 'Não foi possível inserir' });
          }
          const values = [];
          const params = [];
          let contador = 1;
          notas.forEach((nota) => {
            values.push(`($${contador}, $${contador + 1}, $${contador + 2})`);
            contador += 3;
            params.push(nota.alunoId, nota.nota, result.rows[0].id);
          });
          return client.query(
            `insert into nota(aluno, nota, atividade) values ${values.join(',')}`,
            params,
            () => {
              res.status(201).send({ msg: 'Salvo com sucesso' });
              calculoNotas(client, materiaId, notas.map((n) => n.alunoId), release);
            },
          );
        },
      );
    });
  });
};
module.exports = endpointAtividade;
