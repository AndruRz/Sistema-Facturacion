const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const os = require('os');
const routes = require('./routes/index');
const usuarioController = require('./controllers/usuarioController');
const productosController = require('./controllers/productosController'); 
const inventoryController = require('./controllers/inventoryController');
const facturacionController = require('./controllers/facturacionController');
const db = require('./config/db');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

app.use(cors({
    origin: [
        `http://localhost:${port}`,
        `http://${localIP}:${port}`
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/utils', express.static(path.join(__dirname, 'utils'))); 
app.use('/', routes);

db.initializeConnection((err, connection) => {
    if (err) {
        console.error('No se pudo inicializar la base de datos:', err);
        process.exit(1);
    }

    // Inicializar las tablas
    usuarioController.initTable(connection);
    productosController.initTables(connection); 
    inventoryController.initTables(connection); 
    facturacionController.initTables(connection);

    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor corriendo en:`);
        console.log(`👉 Localhost: http://localhost:${port}`);
        console.log(`👉 Red local: http://${localIP}:${port}`);
    });
});