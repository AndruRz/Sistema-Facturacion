const db = require('../config/db');

const usuarioController = {
  initTable: (connection) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_completo VARCHAR(255) NOT NULL,
        correo VARCHAR(255) NOT NULL UNIQUE,
        contraseña VARCHAR(255) NOT NULL
      )
    `;
    connection.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error creando la tabla usuarios:', err);
        return;
      }
    });
  },

  getAllUsuarios: (req, res) => {
    db.initializeConnection((err, connection) => {
      if (err) {
        return res.status(500).json({ error: 'Error conectando a la base de datos' });
      }
      connection.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
      });
    });
  }
};

module.exports = usuarioController;