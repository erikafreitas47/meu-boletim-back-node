const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const endpointPessoas = (app, pool) => {
  app.get('/pessoas', async (request, response) => {
    // #swagger.tags = ['Pessoas']
    // #swagger.summary = 'Retorna uma lista de pessoa de acordo o tipo'
    const { nome, tipo_pessoa: tipoPessoa, mostrarInativos } = request.query;

    let sql = `select p.id pessoaId, p.nome pessoaNome, * from pessoa p
                    left join matricula m on m.id = p.id
                    left join turma t on m.turma = t.id
                    where true`;
    const params = [];

    if (nome) {
      params.push(nome.toLowerCase());
      sql += ` and lower(p.nome) like '%' || $${params.length} || '%'`;
    }

    if (tipoPessoa) {
      params.push(tipoPessoa);
      sql += ` and tipo_pessoa = $${params.length}`;
    }

    if (mostrarInativos !== 'true') {
      sql += ' and ativo = true';
    }

    try {
      const { rows } = await pool.query(sql, params);
      response.status(200).send(
        rows.map((p) => ({
          id: p.pessoaid,
          nome: p.pessoanome,
          telefone: p.telefone,
          turmas: {
            nomeTurma: p.nome,
            turno: p.turno,
            serie: p.serie,
          } || null,
        })),
      );
    } catch (err) {
      response.status(401).send({ msg: 'Operação não autorizada!', err: err.message });
    }
  });

  app.get('/pessoas/:id', (request, response) => {
    // #swagger.tags = ['Pessoas']
    // #swagger.summary = 'Procura pessoa por id e de acordo o tipo'
    pool.connect((err, client, release) => {
      if (err) {
        return response.status(401).send({ msg: 'Conexão não autorizada.' });
      }
      const sql = 'select * from pessoa where id = $1';
      const valor = [request.params.id];

      return client.query(sql, valor, (error, result) => {
        if (error) {
          release();
          return response.status(401).send({ msg: 'Operação não autorizada.', erro: error.message });
        }

        if (result.rows[0].tipo_pessoa === 'ALUNO' || result.rows[0].tipo_pessoa === 'PROFESSOR') {
          let sqlAdicional = '';
          const valorAdicional = [request.params.id];

          if (result.rows[0].tipo_pessoa === 'ALUNO') {
            sqlAdicional = 'select * from matricula mat where mat.id = $1';
          } else if (result.rows[0].tipo_pessoa === 'PROFESSOR') {
            sqlAdicional = `select mate.materia, mate.id as id_professor_materia from professor_materia mate
                                        where mate.professor =  $1`;
          }
          return client.query(sqlAdicional, valorAdicional, (error2, result2) => {
            if (error2) {
              release();
              return response.status(401).send({ msg: 'Operação não autorizada.', erro: error2.message });
            }
            release();
            response.json({ ...result.rows[0], ...result2.rows[0] });
            return response.status(200).end();
          });
        }
        release();
        response.json(result.rows[0]);
        return response.status(200).end();
      });
    });
  });

  app.put('/pessoas/:id', (request, response) => {
    // #swagger.tags = ['Pessoas']
    // #swagger.summary = 'Edita uma nova pessoa existente de acordo o tipo'
    pool.connect((err, client, release) => {
      if (err) {
        return response.status(401).send({ msg: 'Conexão não autorizada.', erro: err.message });
      }

      const sqlInicial = 'select * from pessoa where id = $1';
      const valorInicial = [request.params.id];

      return client.query(sqlInicial, valorInicial, (erro, result) => {
        if (erro) {
          release();
          return response.status(401).send({ msg: 'Operação não autorizada. 1', erro: erro.message });
        }

        if (result.rowCount > 0) {
          if (request.body.senha === '') {
            const sqlUpdate = `update pessoa set nome=$1, genero=$2, datanasc=$3, cep=$4, rua=$5, numero=$6, bairro=$7, 
                                cidade=$8, uf=$9, telefone=$10, email=$11, login=$12, tipo_pessoa=$13, ativo=$14 
                                where id=$15`;
            const valoresUpdate = [
              request.body.nome,
              request.body.genero,
              request.body.datanasc,
              request.body.cep,
              request.body.rua,
              request.body.numero,
              request.body.bairro,
              request.body.cidade,
              request.body.uf,
              request.body.telefone,
              request.body.email,
              request.body.login,
              request.body.tipo_pessoa,
              request.body.ativo,
              request.params.id,
            ];

            return client.query(sqlUpdate, valoresUpdate, (error) => {
              if (error) {
                release();
                return response.status(401).send({ msg: 'Operação não autorizada. 2', erro: error.message });
              }

              let sqlCondicao = '';
              let valorAdicional;

              if (request.body.tipo_pessoa === 'ALUNO') {
                valorAdicional = [
                  request.body.nome_mae,
                  request.body.responsavel,
                  request.body.turmaSelecionada,
                  request.body.nome_pai,
                  request.params.id,
                ];
                sqlCondicao = 'update matricula set nome_mae=$1, responsavel=$2, turma=$3, nome_pai=$4 where id=$5';
              }

              if (request.body.tipo_pessoa === 'PROFESSOR') {
                valorAdicional = [request.body.materia, request.params.id];
                sqlCondicao = 'update professor_materia set materia=$1 where professor=$2';
              }

              return client.query(sqlCondicao, valorAdicional, (error2) => {
                if (error2) {
                  release();
                  return response.status(403).send({ msg: 'Operação não autorizada. 3', erro: error2.message });
                }
                release();
                return response.status(200).send({ msg: 'Registro alterado com sucesso.' });
              });
            });
          }
          return bcrypt.hash(request.body.senha, 10, (error, hash) => {
            if (error) {
              return response.status(500).send({ msg: 'Erro de autenticação.', erro: error.message });
            }

            const sqlUpdate = `update pessoa set nome=$1, genero=$2, datanasc=$3, cep=$4, rua=$5, numero=$6, bairro=$7, 
                                        cidade=$8, uf=$9, telefone=$10, email=$11, login=$12, senha=$13, tipo_pessoa=$14, ativo=$15 
                                        where id=$16`;
            const valoresUpdate = [
              request.body.nome,
              request.body.genero,
              request.body.datanasc,
              request.body.cep,
              request.body.rua,
              request.body.numero,
              request.body.bairro,
              request.body.cidade,
              request.body.uf,
              request.body.telefone,
              request.body.email,
              request.body.login,
              hash,
              request.body.tipo_pessoa,
              request.body.ativo,
              request.params.id,
            ];

            return client.query(sqlUpdate, valoresUpdate, (error3) => {
              if (error3) {
                release();
                return response.status(401).send({ msg: 'Operação não autorizada. 2', erro: error3.message });
              }

              let sqlCondicao = '';
              let valorAdicional;

              if (request.body.tipo_pessoa === 'ALUNO') {
                valorAdicional = [
                  request.body.responsavel,
                  request.body.turma,
                  request.params.id,
                ];
                sqlCondicao = 'update matricula set responsavel=$1, turma=$2 where id=$3';
              }

              if (request.body.tipo_pessoa === 'PROFESSOR') {
                valorAdicional = [request.body.materia, request.params.id];
                sqlCondicao = 'update professor_materia set materia=$1 where professor=$2';
              }

              return client.query(sqlCondicao, valorAdicional, (error2) => {
                if (error2) {
                  release();
                  return response.status(403).send({ msg: 'Operação não autorizada. 3', erro: error2.message });
                }
                release();
                return response.status(200).send({ msg: 'Registro alterado com sucesso.' });
              });
            });
          });
        }
        release();
        return response.status(404).send({ msg: 'Registro não encontrado.' });
      });
    });
  });

  app.post('/pessoas', (request, response) => {
    // #swagger.tags = ['Pessoas']
    // #swagger.summary = 'Salva uma pessoa de acordo o tipo criptografando senha'
    pool.connect((err, client, release) => {
      if (err) {
        return response.status(401).send({ msg: 'Conexão não permitida.' });
      }

      return client.query('select * from pessoa where email = $1', [request.body.email], (error, result) => {
        if (error) {
          release();
          return response.status(401).send(
            {
              msg: 'Operação não autorizada.',
              erro: error.message,
            },
          );
        }

        if (result.rowCount > 0) {
          release();
          return response.status(400).send({ msg: 'Registro já existe!' });
        }

        return bcrypt.hash(request.body.senha, 10, (error2, hash) => {
          if (error2) {
            return response.status(500).send(
              {
                msg: 'Erro de autenticação.',
                erro: error2.message,
              },
            );
          }

          const idGerado = uuidv4();

          const sql = `insert into pessoa(id, nome, genero, datanasc, cep, rua, numero, bairro, cidade, uf, telefone, email, login, senha, tipo_pessoa, ativo) 
                               values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`;

          const valores = [
            idGerado,
            request.body.nome,
            request.body.genero,
            request.body.datanasc,
            request.body.cep,
            request.body.rua,
            request.body.numero,
            request.body.bairro,
            request.body.cidade,
            request.body.uf,
            request.body.telefone,
            request.body.email,
            request.body.login,
            hash,
            request.body.tipo_pessoa,
            request.body.ativo,
          ];

          return client.query(sql, valores, (error3) => {
            if (error3) {
              release();
              return response.status(403).send({ msg: 'Operação não permitida.' });
            }
            let sqlCondicao = '';
            let valorAdicional;

            if (request.body.tipo_pessoa === 'ALUNO') {
              valorAdicional = [
                idGerado,
                request.body.nome_mae,
                request.body.responsavel,
                request.body.turmaSelecionada,
                request.body.nome_pai,
              ];

              sqlCondicao = 'insert into matricula(id, nome_mae, responsavel, turma, nome_pai) values($1, $2, $3, $4, $5)';
            }
            if (request.body.tipo_pessoa === 'PROFESSOR') {
              valorAdicional = [idGerado, request.body.materia];
              sqlCondicao = 'insert into professor_materia values($1, $2)';
            }

            return client.query(sqlCondicao, valorAdicional, (error4) => {
              if (error4) {
                release();
                return response.status(403).send(
                  {
                    msg: 'Operação não autorizada.',
                    error: error4.message,
                  },
                );
              }
              release();
              return response.status(201).send({ msg: 'Usuário criado com sucesso!' });
            });
          });
        });
      });
    });
  });

  app.post('/pessoas/login', (request, response) => {
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
                login: result.rows[0].perfil,
              },
              process.env.JWTKEY,
              { expiresIn: '1h' },
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
};

module.exports = endpointPessoas;
