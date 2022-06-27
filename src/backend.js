const express = require('express');

const app = express();
const cors = require('cors');

const port = process.env.PORT || 8081;

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');

require('dotenv').config();

const materia = require('./materia');
const frequencia = require('./frequencia');
const configEscola = require('./config-escola');
const pessoa = require('./pessoa');
const atividade = require('./atividade');
const turma = require('./turma');
const encriptador = require('./encriptador');
const login = require('./login');

const corsOptions = {
  origin: `${process.env.URL_ANGULAR}`,
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors(corsOptions));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use('/materias', materia);
app.use('/frequencia', frequencia);
app.use('/encript', encriptador);
app.use('/config-escola', configEscola);
app.use('/pessoas', pessoa);
app.use('/atividade', atividade);
app.use('/turmas', turma);
app.use('/login', login);

app.listen(port, () => console.log(`Em execução na porta ${port}`));
