const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Get all active products with optional filters
router.get('/inventario', (req, res) => {
  const { search, category, provider } = req.query;

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }

    let query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.cantidad,
        c.nombre AS categoria_nombre,
        pr.nombre AS proveedor_nombre,
        p.created_at
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.estado = 'activo'
    `;
    const queryParams = [];

    // Apply filters
    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.codigo LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND p.categoria_id = ?';
      queryParams.push(category);
    }
    if (provider) {
      query += ' AND p.proveedor_id = ?';
      queryParams.push(provider);
    }

    query += ' ORDER BY p.created_at DESC';

    connection.query(query, queryParams, (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching inventory:', err);
        return res.status(500).json({ error: 'Error al obtener inventario' });
      }
      res.status(200).json(results);
    });
  });
});

// Add units to a product
router.post('/inventario/agregar-unidades', (req, res) => {
  const inventoryController = require('../controllers/inventoryController');
  inventoryController.addUnits(req, res);
});

// Discount units from a product
router.post('/inventario/descontar-unidades', (req, res) => {
  const inventoryController = require('../controllers/inventoryController');
  inventoryController.discountUnits(req, res);
});

module.exports = router;