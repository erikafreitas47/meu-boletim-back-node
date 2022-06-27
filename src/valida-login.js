const jwtDecode = require('jwt-decode');
const pool = require('./pool-connect');

const validaLogin = async (req, acessosValidos) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwtDecode(token);
    const userId = decoded.id;
    const sql = 'select tipo_pessoa from pessoa where id=$1';
    const { rows: [{ tipo_pessoa: tipoPessoa }] } = await pool.query(sql, [userId]);
    return acessosValidos.includes(tipoPessoa);
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = validaLogin;
