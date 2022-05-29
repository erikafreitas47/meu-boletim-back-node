
let endpointConfigEscola = (app, pool) => {
    app.get('/config-escola', async (req, res) => {
        try {
            const { rows: [config] } = await pool.query('select * from config_escola')
            res.status(200).send(
                {
                    inicioBim1: config.inicio_1bimestre,
                    fimBim1: config.fim_1bimestre,
                    inicioBim2: config.inicio_2bimestre,
                    fimBim2: config.fim_2bimestre,
                    inicioBim3: config.inicio_3bimestre,
                    fimBim3: config.fim_3bimestre,
                    inicioBim4: config.inicio_4bimestre,
                    fimBim4: config.fim_4bimestre,
                    mediaAprovacao: config.media_aprovacao,
                    frequenciaAprovacao: config.frequencia_aprovacao
                }
            )
        } catch (error) {
            return res.status(401).send({ msg: 'Conexão não autorizada' })
        }
    })

    //TODO transferir endpoint para o arquivo pessoa.js
    app.get('/consultar-filhos', async (req, res) => {
        const { id } = req.query;
        try {
            const { rows } = await pool.query(
                `select m.id alunoId, p.nome nomeAluno, t.nome turmaNome, t.serie, t.turno from matricula m
                inner join pessoa p on p.id = m.id 
                inner join turma t on t.id = m.turma
                where m.responsavel = $1`, [id]
            )
            res.status(200).send(
                rows.map((f) => {
                    return {
                        id: f.alunoid,
                        nome: f.nomealuno,
                        serie: f.serie,
                        turma: f.turmanome,
                        turno: f.turno
                    }
                })
            )
        } catch (error) {
            return res.status(401).send({ msg: 'Conexão não autorizada' })
        }
    })
}

module.exports = endpointConfigEscola