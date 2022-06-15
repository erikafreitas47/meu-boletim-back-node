const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';

const endpointsFiles = ['./materia.js', './atividade.js', './turma.js', './pessoa.js',
  './frequencia.js', './config-escola.js'];

swaggerAutogen(outputFile, endpointsFiles).then(() => {
  require('./src/backend.js');
});
