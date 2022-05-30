let endpointTurmas = (app, pool) => {

    app.get('/turmas', (req, res) => {
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({
                    mensagem: 'Conexão não autorizada',
                    error: err.message
                })
            }
            client.query('SELECT * FROM turma ORDER BY nome', (error, result) => {
                if (error) {
                    release()
                    return res.status(401).send({
                        mensagem: 'Falha ao conectar no banco',
                        error: error.message
                    })
                }
                res.status(200).send(result.rows.map(turma => {
                    return {
                        id: turma.id,
                        nome: turma.nome,
                        anoLetivo: turma.ano_letivo,
                        turno: turma.turno,
                        serie: turma.serie
                    }
                }))
                release()
            })
    
        })
    })
    
    app.post('/turmas', (req, res) => {
        let nomeTur = req.body.params.nomeTurma;
        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({
                    mensagem: 'Conexão não autorizada',
                    error: err.message
                })
            }
            client.query('SELECT nome, ano_letivo, turno, serie FROM turma WHERE nome = $1', [nomeTur], (error, result) => {
                if (error) {
                    release()
                    return res.status(401).send({
                        mensagem: 'Falha ao conectar no banco',
                        error: error.message
                    })
                }
                if (!result.rowCount) {
                    release()
                    return res.status(404).send({ msg: `Turma ${nomeTur} não encontrada` })
                }
                res.status(200).send(result.rows.map(turma =>{
                    return {
                        id: turma.id,
                        nome: turma.nome,
                        anoLetivo: turma.ano_letivo,
                        turno: turma.turno,
                        serie: turma.serie
                    }
                }))
                release()
            })
    
        })
    })
}

module.exports = endpointTurmas