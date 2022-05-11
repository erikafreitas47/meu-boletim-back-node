const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 8080

require('dotenv').config()

var pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

var materia = require('./materia')
var frequencia = require('./frequencia')
var turma = require('./turma')

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(cors())

materia(app, pool)
frequencia(app, pool)
turma(app, pool)

app.listen(port, () => console.log(`Em execução na porta ${port}`));
