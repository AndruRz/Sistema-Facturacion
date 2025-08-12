const mysql = require('mysql2');
const dotenv = require('dotenv');
const dbController = require('../controllers/dbController');

dotenv.config();

const initializeConnection = (callback) => {
  const initialConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  initialConnection.connect((err) => {
    if (err) {
      console.error('Error conectando al servidor MySQL:', err);
      return callback(err);
    }

    dbController.initDatabase(initialConnection, () => {
      initialConnection.end((err) => {
        if (err) {
          console.error('Error cerrando la conexión inicial:', err);
          return callback(err);
        }

        const connection = mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        });

        connection.connect((err) => {
          if (err) {
            console.error('Error conectando a la base de datos:', err);
            return callback(err);
          }
          callback(null, connection);
        });
      });
    });
  });
};

module.exports = { initializeConnection };