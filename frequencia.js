let endpointFrequencias = (app, pool) => {

    var sql = `select f.id freqId, f.data_presenca, f.presenca, 
    p.nome alunoNome, p.id alunoId, m.nome materiaNome, m.id materiaId 
    from frequencia f
    inner join pessoa p on p.id = f.aluno 
    inner join materia m on m.id = f.materia`

    const dePara = (dado) => {
        return {
            id: dado.freqid,
            dataPresenca: dado.data_presenca,
            presenca: dado.presenca,
            aluno: {
                id: dado.alunoid,
                nome: dado.alunonome
            },
            materia: {
                id: dado.materiaid,
                nome: dado.materianome
            }
        }
    }

    app.get('/frequencias', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }

            client.query(sql, (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não autorizado'})
                }
                res.status(200).send(result.rows.map((e) => dePara(e)))
            })
        })
    })

    app.get('/frequencias/:id', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query(`${sql} where f.id = $1`, [req.params.id], (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não autorizado'})
                }
                res.status(200).send(dePara(result.rows[0]))
            })
        })
    })

    app.post('/frequencias', (req, res) => {
        const { aluno, materia, dataPres, presenca } = req.body
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('select * from pessoa where id = $1', [aluno], (err, result) => {
                if (err || !result.rowCount) {
                    return res.status(404).send({msg:'Aluno não encontrado'})
                }
                client.query('select * from materia where id = $1', [materia], (err, result) => {
                    if (err || !result.rowCount) {
                        return res.status(404).send({msg:'Matéria não encontrada'})
                    }
                    client.query('insert into frequencia(aluno, materia, data_presenca, presenca) values($1, $2, $3, $4)',
                        [aluno, materia, dataPres, presenca], (err, result) => {
                            if (err) {
                                return res.status(401).send({msg:'Não autorizado'})
                            }
                            res.status(201).send({msg: 'Salvo com sucesso'})
                        })
                })
            })
        })
    })

    app.put('/frequencias/:id', (req, res) => {
        const { aluno, materia, dataPres, presenca } = req.body
        let id = req.params.id
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('select * from frequencia where id = $1', [id], (err, result) => {
                if (err || !result.rowCount) {
                    return res.status(404).send({msg:'Frequencia não encontrada'})
                }
                client.query('select * from pessoa where id = $1', [aluno], (err, result) => {
                    if (err || !result.rowCount) {
                        return res.status(404).send({msg:'Aluno não encontrado'})
                    }
                    client.query('select * from materia where id = $1', [materia], (err, result) => {
                        if (err || !result.rowCount) {
                            return res.status(404).send({msg:'Matéria não encontrada'})
                        }
                        client.query('update frequencia set aluno = $1, materia=$2, data_presenca =$3, presenca =$4 where id=$5',
                            [aluno, materia, dataPres, presenca, id], (err, result) => {
                                if (err) {
                                    return res.status(401).send({msg:'Erro na atualização'})
                                }
                                res.status(200).send({msg:'Alterado com sucesso'})
                            })
                    })
                })
            })
        })
    })

    app.delete('/frequencias/:id', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('delete from frequencia where id = $1', [req.params.id], (err, result) => {
                if (err) {
                    return res.status(404).send({msg:'Registro não existe'})
                }
                res.status(201).send({msg:'Excluído com sucesso'})
            })
        })
    })
}

module.exports = endpointFrequencias
