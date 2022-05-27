const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

let endpointPessoas = (app, pool) => {

    app.get('/pessoas', async (request, response) => {

        const { nome, tipo_pessoa, mostrarInativos } = request.query;

        let sql = `select p.id pessoaId, p.nome pessoaNome, * from pessoa p
                    left join matricula m on m.id = p.id
                    left join turma t on m.turma = t.id
                    where true`;
        const params = [];

        if (nome){
            params.push(nome);
            sql += ` and p.nome like '%' || $${params.length} || '%'`; 
        }

        if (tipo_pessoa){
            params.push(tipo_pessoa);
            sql += ` and tipo_pessoa = $${params.length}`; 
        }

        if (mostrarInativos !== "true"){
            sql += ` and ativo = true`; 
        }

        console.log(sql);

        try {
            const { rows } = await pool.query(sql, params);
            response.status(200).send(
                rows.map((p) => {
                    return {
                        id: p.pessoaid,
                        nome: p.pessoanome,
                        telefone: p.telefone,
                        turmas: {} || null
                    }
                })
            )
        } catch (err) {
            response.status(401).send({msg: "Operação não autorizada!", err: err.message})
        }
    })

    app.get('/pessoas/:id', (request, response) => {
        pool.connect((err, client) => {  
            if (err) {
                return response.status(401).send("Conexão não autorizada.")
            }
            let sql = `select * from pessoa where id = '${request.params.id}'`
    
            client.query(sql, (error, result) => {
                if (error){
                    return response.status(401).send({msg: "Operação não autorizada.", erro: error.message})
                }

                if (result.rows[0].tipo_pessoa === "ALUNO" || result.rows[0].tipo_pessoa === "PROFESSOR"){

                    let sqlAdicional = ""

                    if (result.rows[0].tipo_pessoa === "ALUNO"){
                       sqlAdicional = `select * from matricula mat where mat.id = '${request.params.id}'`
                    }
                    else if (result.rows[0].tipo_pessoa === "PROFESSOR") {
                        sqlAdicional = `select mate.materia, mate.id as id_professor_materia from professor_materia mate
                                        where mate.professor = '${request.params.id}'`
                    }
    
                    client.query(sqlAdicional, (error2, result2) => {
                        if (error2){
                            return response.status(401).send({msg: "Operação não autorizada.", erro: error2.message})
                        }
                        response.json(Object.assign(result.rows[0] , result2.rows[0]))
                        response.status(200).end()
                    })
                } else {
                    response.json(result.rows[0]);
                    response.status(200).end()
                }
                client.release()                                
            })
        })
    })

    app.post('/pessoas', (request, response) => {

        pool.connect((err, client) => {
            if (err) {
                return response.status(401).send("Conexão não permitida.")
            }
    
            client.query('select * from pessoa where email = $1', [request.body.email], (error, result) => {
                if (error) {
                    return response.status(401).send(
                        {
                            msg: "Operação não autorizada.",
                            erro: error.message
                        }
                    )
                }
    
                if (result.rowCount > 0) {
                    return response.status(200).send("Registro já existe!")
                }
    
                bcrypt.hash(request.body.senha, 10, (error, hash) => {
                    if (error) {
                        return response.status(500).send(
                            {
                                message: "Erro de autenticação.",
                                erro: error.message
                            }
                        )
                    }

                    const idGerado = uuidv4();
    
                    var sql = `insert into pessoa(id, nome, genero, datanasc, cep, rua, numero, bairro, cidade, uf, telefone, email, login, senha, tipo_pessoa, ativo) 
                               values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

                    var valores = [idGerado, request.body.nome, request.body.genero, request.body.datanasc, request.body.cep, request.body.rua, request.body.numero, 
                                request.body.bairro, request.body.cidade, request.body.uf, request.body.telefone, request.body.email, request.body.login, hash, 
                                request.body.tipo_pessoa, request.body.ativo];                    
                    
                    client.query(sql,valores, (error, result) => {
                        if (error) {
                            return response.status(403).send("Operação não permitida.")
                        }                        
                        var sqlCondicao = "";

                        if (request.body.tipo_pessoa === "ALUNO"){
                            var sqlCondicao = `insert into matricula values('${idGerado}', null, '${request.body.responsavel}', '${request.body.turma}', null)`; 
                        }
                        else {
                            var sqlCondicao = `insert into professor_materia values('${idGerado}', '${request.body.materia}')`;
                        }

                        client.query(sqlCondicao, (error2, result2) => {
                            if (error2) {
                                return response.status(403).send(
                                    {
                                        msg: "Operação não autorizada.",
                                        error: error.message
                                    }
                                )
                            }
                             response.status(201).send({mensagem: 'Usuário criado com sucesso!'})
                        })       
                        
                        client.release()
                    })
                })
            })
        })
    })   

}

module.exports = endpointPessoas