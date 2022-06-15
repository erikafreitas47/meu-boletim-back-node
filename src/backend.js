const express = require('express');

const app = express();
const cors = require('cors');
const pg = require('pg');

const port = process.env.PORT || 8081;

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');

require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const materia = require('./materia');
const frequencia = require('./frequencia');
const configEscola = require('./config-escola');
const pessoa = require('./pessoa');
const atividade = require('./atividade');
const turma = require('./turma');
const encriptador = require('./encriptador');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

materia(app, pool);
frequencia(app, pool);
encriptador(app);
configEscola(app, pool);
pessoa(app, pool);
atividade(app, pool);
turma(app, pool);

app.listen(port, () => console.log(`Em execução na porta ${port}`));
