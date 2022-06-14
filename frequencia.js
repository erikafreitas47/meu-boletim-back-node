const { calculoFrequencias } = require('./calculos')
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

    app.get('/buscar-frequencia', (req, res) => {
        // #swagger.tags = ['Frequências']
        //#swagger.summary = 'Retorna uma lista de frequências por turma e por matéria'
        pool.connect((err, client, release) => {
            const { turmaId, materiaId, data } = req.query
            if (!turmaId || !materiaId || !data) {
                return res.status(401).send({ msg: 'Informe turma, materia e data' })
            }
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }

            client.query(sqlAlunos, [turmaId], (err, resultAlunos) => {
                if (err) {
                    release()
                    return res.status(401).send({ msg: 'Não autorizado' })
                }
                client.query(sqlFrequencia, [resultAlunos.rows.map((a) => a.id), data, materiaId], (err, result) => {
                    if (err) {
                        release()
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
                    release()
                })
            })
        })
    })

    app.post('/salvar-frequencia', (req, res) => {
        // #swagger.tags = ['Frequências']
        //#swagger.summary = 'Salva ou edita uma lista de frequências por turma e por matéria'
        const { alunos, materiaId, dataPresenca } = req.body
        const dataAtual = new Date()

        if(dataAtual <= new Date(dataPresenca)){
            return res.status(400).send({ msg: 'Escolha uma data dentro do intervalo' })}

        pool.connect((err, client, release) => {
            if (err) {
                return res.status(401).send({ msg: 'Conexão não autorizada' })
            }
            client.query('select * from materia where id = $1', [materiaId], (err, result) => {
                if (err || !result.rowCount) {
                    release()
                    return res.status(404).send({ msg: 'Matéria não encontrada' })
                }
                const validaPessoa = []
                alunos.forEach((aluno) => {
                    validaPessoa.push(client.query('select * from pessoa where id = $1', [aluno.id]))
                })
                Promise.all(validaPessoa).then((results) => {
                    if (results.every((r) => !r.rowCount)) {
                        release()
                        return res.status(404).send({ msg: `Aluno não encontrado` })
                    }
                    const insertUpdate = []
                    alunos.forEach((aluno) => {
                        if (!aluno.frequenciaId) {
                            insertUpdate.push(client.query('insert into frequencia(aluno, materia, data_presenca, presenca) values($1, $2, $3, $4)',
                                [aluno.id, materiaId, dataPresenca, aluno.presenca]))
                        } else {
                            insertUpdate.push(client.query(`update frequencia set presenca=$1 where id=$2`,
                                [aluno.presenca, aluno.frequenciaId]))
                        }
                    })
                    Promise.all(insertUpdate).then(() => {
                        res.status(201).send({ msg: 'Salvo com sucesso' })
                        calculoFrequencias(client, materiaId, alunos.map((a) => a.id), release)
                    })
                })
            })
        })
    })

}

module.exports = endpointFrequencias
