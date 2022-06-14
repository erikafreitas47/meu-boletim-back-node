const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 8081

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

require('dotenv').config()

var pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

var materia = require('./materia')
var frequencia = require('./frequencia')
var configEscola = require('./config-escola')
var pessoa = require('./pessoa')
var atividade = require('./atividade')
var turma = require('./turma')
var encriptador = require('./encriptador')

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(cors())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

materia(app, pool)
frequencia(app, pool)
encriptador(app)
configEscola(app, pool)
pessoa(app, pool)
atividade(app, pool)
turma(app, pool)

app.listen(port, () => console.log(`Em execução na porta ${port}`));
