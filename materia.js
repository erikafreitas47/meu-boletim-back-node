let endpointMaterias = (app, pool) => {

    app.get('/materias', (req, res) => {
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            var sql = 'select * from materia'
            client.query(sql, (err, result) => {
                if (err) {
                    release()
                    return res.status(401).send({ msg: 'Não autorizado' })
                }
                res.status(200).send(result.rows)
                release()
            })
        })
    })

    app.get('/materias/:id', (req, res) => {
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query('select * from materia where id = $1', [req.params.id], (err, result) => {
                if (err) {
                    release()
                    return res.status(401).send({ msg: 'Não encontrado' })
                }
                res.status(200).send(result.rows[0])
                release()
            })
        })
    })

    app.post('/materias', (req, res) => {
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            const { nome, id } = req.body
            if (id) {
                client.query('update materia set nome=$1 where id = $2', [nome, id], (err, result) => {
                    if (err) {
                        release()
                        return res.status(401).send({ msg: 'Não foi possível alterar' })
                    }
                    res.status(200).send({ msg: 'Alterado com sucesso' })
                    release()
                })
            } else {
                client.query('select * from materia where nome = $1', [nome], (err, result) => {
                    if (err) {
                        release()
                        return res.status(401).send({ msg: 'Não autorizado' })
                    }
                    if (result.rowCount > 0) {
                        release()
                        return res.status(403).send({ msg: 'Matéria já cadastrada' })
                    }
                    client.query('insert into materia(nome) values($1)', [nome], (err, result) => {
                        if (err) {
                            release()
                            return res.status(401).send({ msg: 'Não foi possível salvar' })
                        }
                        release()
                        res.status(201).send({ msg: 'Salvo com sucesso' })
                    })
                })
            }
        })
    })

    app.delete('/materias/:id', (req, res) => {
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query('delete from materia where id = $1', [req.params.id], (err, result) => {
                if (err) {
                    release()
                    return res.status(400).send({ msg: 'Não é possível excluir uma matéria em uso.' })
                }
                release()
                res.status(200).send({ msg: 'Excluído com sucesso' })
            })
        })
    })
}

module.exports = endpointMaterias
