let endpointMaterias = (app, pool) => {

    app.get('/materias', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            var sql = 'select * from materia'
            client.query(sql, (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não autorizado'})
                }
                res.status(200).send(result.rows)
                client.release()
            })
        })
    })

    app.get('/materias/:id', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('select * from materia where id = $1', [req.params.id], (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não encontrado'})
                }
                res.status(200).send(result.rows[0])
                client.release()
            })
        })
    })

    app.post('/materias', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('select * from materia where nome = $1', [req.body.nome], (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não autorizado'})
                }
                if (result.rowCount > 0) {
                    return res.status(403).send({msg:'Matéria já cadastrada'})
                }
                client.query('insert into materia(nome) values($1)', [req.body.nome], (err, result) => {
                    if (err) {
                        return res.status(401).send({msg:'Não foi possível salvar'})
                    }
                    res.status(201).send({msg: 'Salvo com sucesso'})
                    client.release()
                })
            })
        })
    })

    app.put('/materias/:id', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('update materia set nome=$1 where id = $2', [req.body.nome, req.params.id], (err, result) => {
                if (err) {
                    return res.status(401).send({msg:'Não foi possível alterar'})
                }
                res.status(200).send({msg:'Alterado com sucesso'})
                client.release()
            })
        })
    })

    app.delete('/materias/:id', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({msg: 'Conexão não autorizada'})
            }
            client.query('delete from materia where id = $1', [req.params.id], (err, result) => {
                if (err) {
                    return res.status(404).send({msg:'Matéria não existe'})
                }
                res.status(200).send({msg:'Excluído com sucesso'})
                client.release()
            })
        })
    })
}

module.exports = endpointMaterias
