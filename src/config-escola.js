const endpointConfigEscola = (app, pool) => {
  app.get('/config-escola', async (_req, res) => {
    // #swagger.tags = ['Configurações da escola']
    // #swagger.summary = 'Retorna uma lista de informações'
    try {
      const { rows: [config] } = await pool.query('select * from config_escola');
      return res.status(200).send(
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
          frequenciaAprovacao: config.frequencia_aprovacao,
        },
      );
    } catch (error) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
  });

  app.post('/config-escola', async (req, res) => {
    // #swagger.tags = ['Configurações da escola']
    // #swagger.summary = 'Salva ou atualiza uma lista de informações'
    const {
      inicioBim1, fimBim1, inicioBim2, fimBim2, inicioBim3, fimBim3, inicioBim4, fimBim4,
      mediaAprovacao, frequenciaAprovacao,
    } = req.body;
    if ([inicioBim1, fimBim1, inicioBim2, fimBim2, inicioBim3, fimBim3, inicioBim4, fimBim4,
      mediaAprovacao, frequenciaAprovacao].some((e) => !e)) {
      return res.status(400).send({ msg: 'Todos campos são obrigatórios' });
    }
    if (frequenciaAprovacao <= 0 || frequenciaAprovacao > 100) {
      return res.status(400).send({ msg: 'Valor inválido' });
    }
    if (mediaAprovacao <= 0 || mediaAprovacao > 10) {
      return res.status(400).send({ msg: 'Valor inválido' });
    }

    const sql = `update config_escola set inicio_1bimestre=$1, fim_1bimestre=$2, inicio_2bimestre=$3, 
            fim_2bimestre=$4, inicio_3bimestre=$5, fim_3bimestre=$6, inicio_4bimestre=$7, fim_4bimestre=$8, 
            media_aprovacao=$9, frequencia_aprovacao=$10`;
    try {
      await pool.query(sql, [inicioBim1, fimBim1, inicioBim2, fimBim2, inicioBim3,
        fimBim3, inicioBim4, fimBim4, mediaAprovacao, frequenciaAprovacao]);
      return res.status(201).send({ msg: 'Alterações salvas com sucesso' });
    } catch (error) {
      return res.status(401).send({ msg: 'Conexão não autorizada' });
    }
  });
};

module.exports = endpointConfigEscola;
