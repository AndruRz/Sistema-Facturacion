const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const mysql = require('mysql2');
    const dotenv = require('dotenv');
    const dbController = require('../controllers/dbController');

    dotenv.config();

    const initialConnection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    initialConnection.connect((err) => {
        if (err) {
            console.error('Error conectando al servidor MySQL:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        dbController.initDatabase(initialConnection, () => {
            initialConnection.end((err) => {
                if (err) {
                    console.error('Error cerrando la conexión inicial:', err);
                    return res.status(500).json({ error: 'Error de conexión a la base de datos' });
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
                        return res.status(500).json({ error: 'Error de conexión a la base de datos' });
                    }

                    const checkEmailQuery = 'SELECT * FROM usuarios WHERE correo = ?';
                    connection.query(checkEmailQuery, [email], async (err, results) => {
                        if (err) {
                            console.error('Error al verificar el correo:', err);
                            connection.end();
                            return res.status(500).json({ error: 'Error al verificar el correo' });
                        }

                        if (results.length > 0) {
                            connection.end();
                            return res.status(400).json({ error: 'El correo ya está registrado' });
                        }

                        const saltRounds = 10;
                        let hashedPassword;
                        try {
                            hashedPassword = await bcrypt.hash(password, saltRounds);
                        } catch (hashErr) {
                            console.error('Error al hashear la contraseña:', hashErr);
                            connection.end();
                            return res.status(500).json({ error: 'Error al procesar la contraseña' });
                        }

                        const insertQuery = 'INSERT INTO usuarios (nombre_completo, correo, contraseña) VALUES (?, ?, ?)';
                        connection.query(insertQuery, [fullName, email, hashedPassword], async (err) => {
                            if (err) {
                                console.error('Error al registrar el usuario:', err);
                                connection.end();
                                return res.status(500).json({ error: 'Error al registrar el usuario' });
                            }

                            const animationFilePath = path.join(__dirname, '../data/animation.json');
                            let animationData = { registeredEmails: [] };

                            try {
                                try {
                                    const data = await fs.readFile(animationFilePath, 'utf8');
                                    animationData = JSON.parse(data);
                                } catch (fileErr) {
                                    if (fileErr.code !== 'ENOENT') {
                                        console.error('Error al leer animation.json:', fileErr);
                                        throw fileErr;
                                    }
                                }

                                if (!Array.isArray(animationData.registeredEmails)) {
                                    animationData.registeredEmails = [];
                                }

                                if (!animationData.registeredEmails.includes(email)) {
                                    animationData.registeredEmails.push(email);
                                    await fs.writeFile(animationFilePath, JSON.stringify(animationData, null, 2));
                                }
                            } catch (fileErr) {
                                console.error('Error al guardar animation.json:', fileErr);
                                connection.end();
                                return res.status(500).json({ error: 'Error al guardar datos de animación' });
                            }

                            connection.end();
                            res.status(201).json({ message: 'Usuario registrado exitosamente', redirect: '/Facturacion' });
                        });
                    });
                });
            });
        });
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const mysql = require('mysql2');
    const dotenv = require('dotenv');
    const bcrypt = require('bcrypt');

    dotenv.config();

    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error conectando a la base de datos:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }
        const checkEmailQuery = 'SELECT * FROM usuarios WHERE correo = ?';
        connection.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                connection.end();
                return res.status(500).json({ error: 'Error al verificar el correo' });
            }

            if (results.length === 0) {
                connection.end();
                return res.status(400).json({ error: 'Correo no existente' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.contraseña);

            if (!isMatch) {
                connection.end();
                return res.status(400).json({ error: 'Contraseña errada' });
            }

            connection.end();
            res.status(200).json({ message: 'Inicio de sesión exitoso', redirect: '/Facturacion' });
        });
    });
});

router.post('/logout', async (req, res) => {
    try {
        res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
});


module.exports = router;