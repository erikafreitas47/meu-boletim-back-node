let endpointTurmas = (app, pool) => {

    app.get('/turmas', (req, res) => {
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({
                    mensagem: 'Conexão não autorizada',
                    error: err.message
                })
            }
            client.query('SELECT * FROM turma ORDER BY nome', (error, result) => {
                if (error) {
                    return res.status(401).send({
                        mensagem: 'Falha ao concectar no banco',
                        error: error.message
                    })
                }
                res.status(200).send(result.rows)
                client.release()
            })
    
        })
    })
    
    app.post('/turmas', (req, res) => {
        let nomeTur = req.body.nome;
        pool.connect((err, client) => {
            if (err) {
                return res.status(401).send({
                    mensagem: 'Conexão não autorizada',
                    error: err.message
                })
            }
            client.query('SELECT nome, ano_letivo, turno, serie FROM turma WHERE nome = $1', [nomeTur], (error, result) => {
                if (error) {
                    return res.status(401).send({
                        mensagem: 'Falha ao concectar no banco',
                        error: error.message
                    })
                }
                res.status(200).send(result.rows[0])
                client.release()
            })
    
        })
    })
}

module.exports = endpointTurmas