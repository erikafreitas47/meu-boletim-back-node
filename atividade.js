let endpointAtividade = (app, pool) => {

    app.get('/listar-atividades', (req, res) => {
        const { turmaId, materiaId } = req.query
        if (!turmaId || !materiaId) {
            return res.status(401).send({ msg: 'Informe turma e materia' })
        }
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query(`select * from atividade where materia = $1 and turma = $2`,
                [materiaId, turmaId], (err, resultAtiv) => {
                    if (err) {
                        return res.status(401).send({ msg: 'Não autorizado' })
                    }
                    res.status(200).send(resultAtiv.rows.map((ativ) => {
                        return {
                            id: ativ.id,
                            data: ativ.data_atividade,
                            tipo: ativ.tipo_atividade
                        }
                    }))
                    client.release()
                })
        })
    })

    app.delete('/atividade', (req, res) => {
        const { atividadeId } = req.query
        if (!atividadeId) {
            return res.status(401).send({ msg: 'Informe atividade' })
        }
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query('delete from nota where atividade = $1', [atividadeId], (err, result) => {
                if (err) {
                    return res.status(404).send({ msg: 'Nota não existe' })
                }
                client.query('delete from atividade where id = $1', [atividadeId], (err, result) => {
                    if (err) {
                        return res.status(404).send({ msg: 'Atividade não existe' })
                    }
                    res.status(200).send({ msg: 'Excluído com sucesso' })
                    client.release()
                })
            })
        })
    })

    app.get('/buscar-nota', (req, res) => {
        const { atividadeId, turmaId } = req.query
        if ((atividadeId && turmaId) || (!atividadeId && !turmaId)) {
            return res.status(401).send({ msg: 'Informe apenas atividade ou apenas turma' })
        }
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            if (atividadeId) {
                client.query('select * from atividade where  id = $1', [atividadeId], (err, resultAtiv) => {
                    if (err) {
                        return res.status(404).send({ msg: 'Não autorizado' })
                    }
                    const atividade = resultAtiv.rows[0]
                    client.query('select n.id notaId, p.id alunoId, * from nota n inner join pessoa p on n.aluno = p.id where n.atividade = $1',
                        [atividadeId], (err, resultNotas) => {
                            if (err) {
                                return res.status(404).send({ msg: 'Não autorizado' })
                            }
                            res.status(200).send({
                                turma: { id: atividade.turma },
                                dataAtividade: atividade.data_atividade,
                                tipoAtividade: atividade.tipo_atividade,
                                materia: { id: atividade.materia },
                                notas: resultNotas.rows.map((n) => {
                                    return {
                                        aluno: { id: n.alunoid, nome: n.nome },
                                        nota: n.nota
                                    }
                                })
                            })
                            client.release()
                        })
                })
            } else {
                client.query('select p.id alunoId, * from matricula m inner join pessoa p on p.id = m.id where m.turma = $1',
                    [turmaId], (err, result) => {
                        if (err) {
                            return res.status(404).send({ msg: 'Não autorizado' })
                        }
                        return res.status(200).send({
                            turma: { id: turmaId },
                            notas: result.rows.map((n) => {
                                return {
                                    aluno: { id: n.alunoid, nome: n.nome }
                                }
                            })
                        })
                    })
            }
        })
    })

    app.post('/salvar-atividade', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            const { atividadeId, turmaId, dataAtividade, tipoAtividade, materiaId, notas } = req.body
            if (atividadeId) {
                client.query(`update atividade set materia=$1, 
                data_atividade=$2, tipo_atividade=$3, turma=$4 where id=$5`,
                    [materiaId, dataAtividade, tipoAtividade, turmaId, atividadeId], (err, result) => {
                        if (err) {
                            return res.status(401).send({ msg: 'Não foi possível alterar' })
                        }
                        let queries = []
                        notas.forEach(nota => {
                            queries.push(client.query(`update nota set nota=$1 where aluno=$2 and atividade=$3`,
                                [nota.nota, nota.alunoId, atividadeId]))
                        })
                        Promise.all(queries).then(() => {
                            res.status(200).send({ msg: 'Alterado com sucesso' })
                            client.release()
                        })
                    })
            } else {
                client.query(`insert into atividade(materia, data_atividade, tipo_atividade,
                    turma) values($1, $2, $3, $4) returning id`,
                    [materiaId, dataAtividade, tipoAtividade, turmaId], (err, result) => {
                        if (err) {
                            return res.status(401).send({ msg: 'Não foi possível inserir' })
                        }
                        let values = []
                        let params = []
                        let contador = 1
                        notas.forEach(nota => {
                            values.push(`($${contador++}, $${contador++}, $${contador++})`)
                            params.push(nota.alunoId, nota.nota, result.rows[0].id)
                        })
                        client.query(`insert into nota(aluno, nota, atividade) values ${values.join(',')}`,
                            params, () => {
                                res.status(201).send({ msg: 'Salvo com sucesso' })
                                client.release()
                            })

                    })
            }
        })
    })
}
module.exports = endpointAtividade