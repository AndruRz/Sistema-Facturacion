const dotenv = require('dotenv');

dotenv.config();

const dbController = {
  initDatabase: (initialConnection, callback) => {
    // Crear la base de datos si no existe
    initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
      if (err) {
        console.error('Error creando la base de datos:', err);
        return;
      }
      callback();
    });
  }
};

module.exports = dbController;