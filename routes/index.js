const express = require('express');
const path = require('path');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const signupRouter = require('./signup');
const productsRouter = require('./products'); 
const inventoryRouter = require('./inventory');
const facturacionRouter = require('./facturacion');
const gestionRoutes = require('./gestion');


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/home.html'));
});

router.get('/Facturacion', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/app.html'));
});

router.get('/api/usuarios', usuarioController.getAllUsuarios);
router.use('/api', signupRouter); 
router.use('/api', productsRouter); 
router.use('/api', inventoryRouter);
router.use('/api', facturacionRouter);
router.use('/api/gestion', gestionRoutes);

module.exports = router;