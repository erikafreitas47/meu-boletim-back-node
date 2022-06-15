const axios = require('axios');

const filtroB1 = (data, config) => data >= config.inicio_1bimestre && data <= config.fim_1bimestre;
const filtroB2 = (data, config) => data >= config.inicio_2bimestre && data <= config.fim_2bimestre;
const filtroB3 = (data, config) => data >= config.inicio_3bimestre && data <= config.fim_3bimestre;
const filtroB4 = (data, config) => data >= config.inicio_4bimestre && data <= config.fim_4bimestre;

const calculoNotas = async (client, materiaId, alunos, release) => {
  const { rows: [config] } = await client.query('select * from config_escola');

  const mapNota = (r) => r.nota;
  const calcMedia = (previousV, currentV, index) => previousV + (currentV - previousV) / (index + 1);

  for (const aluno of alunos) {
    const { rows } = await client.query(`select * from atividade a 
    inner join nota n on a.id = n.atividade 
    where data_atividade between $1 and $2
    and materia = $3 and aluno = $4`, [config.inicio_1bimestre, config.fim_4bimestre, materiaId, aluno]);
    const notaBim1 = rows.filter((r) => filtroB1(r.data_atividade, config)).map(mapNota).reduce(calcMedia, 0);
    const notaBim2 = rows.filter((r) => filtroB2(r.data_atividade, config)).map(mapNota).reduce(calcMedia, 0);
    const notaBim3 = rows.filter((r) => filtroB3(r.data_atividade, config)).map(mapNota).reduce(calcMedia, 0);
    const notaBim4 = rows.filter((r) => filtroB4(r.data_atividade, config)).map(mapNota).reduce(calcMedia, 0);

    const body = {
      materiaId,
      alunoId: aluno,
      notaBim1,
      notaBim2,
      notaBim3,
      notaBim4,
      anoLetivo: config.inicio_1bimestre.getFullYear(),
    };

    axios.post(`${process.env.URL_JAVA}/boletim/nota`, body)
      .then(() => { console.log('Foi enviado para o java:', body); })
      .catch(() => { console.error('Erro na conexão com Java', body); });
  }
  release();
};

const calculoFrequencias = async (client, materiaId, alunos, release) => {
  const { rows: [config] } = await client.query('select * from config_escola');

  const filtroNaoPresenca = (r) => !r.presenca;

  for (const aluno of alunos) {
    const { rows } = await client.query(`select * from frequencia where data_presenca between $1 and $2
    and materia = $3 and aluno = $4`, [config.inicio_1bimestre, config.fim_4bimestre, materiaId, aluno]);
    const qtdeFaltaBim1 = rows.filter((r) => filtroB1(r.data_presenca, config)).filter(filtroNaoPresenca).length;
    const qtdeFaltaBim2 = rows.filter((r) => filtroB2(r.data_presenca, config)).filter(filtroNaoPresenca).length;
    const qtdeFaltaBim3 = rows.filter((r) => filtroB3(r.data_presenca, config)).filter(filtroNaoPresenca).length;
    const qtdeFaltaBim4 = rows.filter((r) => filtroB4(r.data_presenca, config)).filter(filtroNaoPresenca).length;

    const qtdePresenca = rows.filter((r) => r.presenca).length;

    const body = {
      materiaId,
      alunoId: aluno,
      qtdeFaltaBim1,
      qtdeFaltaBim2,
      qtdeFaltaBim3,
      qtdeFaltaBim4,
      anoLetivo: config.inicio_1bimestre.getFullYear(),
      qtdePresenca,
    };

    axios.post(`${process.env.URL_JAVA}/boletim/frequencia`, body)
      .then(() => { console.log('Foi enviado para o java:', body); })
      .catch(() => { console.error('Erro na conexão com Java', body); });
  }
  release();
};

module.exports = { calculoNotas, calculoFrequencias };
