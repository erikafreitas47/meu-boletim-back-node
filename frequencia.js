let endpointFrequencias = (app, pool) => {

    var sqlFrequencia = `select f.id freqId, f.data_presenca, f.presenca, 
    p.nome alunoNome, p.id alunoId, m.nome materiaNome, m.id materiaId 
    from frequencia f
    inner join pessoa p on p.id = f.aluno 
    inner join materia m on m.id = f.materia
    where p.id = ANY($1) 
    and f.data_presenca = $2
    and f.materia = $3`

    var sqlAlunos = `select p.id, p.nome from matricula
    inner join pessoa p on matricula.id = p.id
    where matricula.turma = $1`

    app.get('/frequencias', (req, res) => {
        pool.connect((err, client) => {
            const { turmaId, materiaId, data } = req.query
            if (!turmaId || !materiaId || !data) {
                return res.status(401).send({ msg: 'Informe turma, materia e data' })
            }
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }

            client.query(sqlAlunos, [turmaId], (err, resultAlunos) => {
                if (err) {
                    return res.status(401).send({ msg: 'Não autorizado' })
                }
                client.query(sqlFrequencia, [resultAlunos.rows.map((a) => a.id), data, materiaId], (err, result) => {
                    if (err) {
                        return res.status(401).send({ msg: 'Não autorizado' })
                    }

                    res.status(200).send(resultAlunos.rows.map((aluno) => {
                        const { freqid, presenca } = result.rows.find((r) => r.alunoid === aluno.id) || {}
                        return {
                            id: freqid,
                            presenca,
                            aluno,
                        }
                    }))
                    client.release()
                })
            })
        })
    })

    app.post('/frequencias', (req, res) => {
        const { alunos, materia, dataPres } = req.body
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query('select * from materia where id = $1', [materia], (err, result) => {
                if (err || !result.rowCount) {
                    return res.status(404).send({ msg: 'Matéria não encontrada' })
                }
                alunos.forEach((aluno) => {
                    let erro = false;
                    if (!erro) {
                        client.query('select * from pessoa where id = $1', [aluno.id], (err, result) => {
                            if (err || !result.rowCount) {
                                erro = true
                                return res.status(404).send({ msg: `Aluno ${aluno.id} não encontrado` })
                            }
                            if (!aluno.frequenciaId) {
                                client.query('insert into frequencia(aluno, materia, data_presenca, presenca) values($1, $2, $3, $4)',
                                    [aluno.id, materia, dataPres, aluno.presenca], (err, result) => {
                                        if (err) {
                                            erro = true
                                            return res.status(401).send({ msg: 'Não autorizado' })
                                        }
                                    })
                            } else {
                                client.query(`update frequencia set presenca=$1 where id=$2`,
                                    [aluno.presenca, aluno.frequenciaId], (err, result) => {
                                        if (err) {
                                            erro = true
                                            return res.status(401).send({ msg: 'Não autorizado' })
                                        }
                                        client.release()
                                    })
                            }
                        })
                    }
                })
                return res.status(201).send({ msg: 'Salvo com sucesso' })

            })
        })
    })

}

module.exports = endpointFrequencias
