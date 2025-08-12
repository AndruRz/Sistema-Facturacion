const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Get all products with optional filters
router.get('/productos', (req, res) => {
  const { search, category, provider, state } = req.query;

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
        p.id, p.codigo, p.nombre, p.precio, p.cantidad, p.estado,
        p.proveedor_id,  -- ⭐ IMPORTANTE: Asegúrate de incluir este campo
        c.nombre AS categoria_nombre,
        pr.nombre AS proveedor_nombre,
        p.fecha,
        p.created_at
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE 1=1
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
    if (state) {
      query += ' AND p.estado = ?';
      queryParams.push(state);
    }

    // Sort by created_at DESC
    query += ' ORDER BY p.created_at DESC';

    connection.query(query, queryParams, (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ error: 'Error al obtener productos' });
      }
      res.status(200).json(results);
    });
  });
});

// Get all categories
router.get('/categorias', (req, res) => {
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

    const query = 'SELECT id, nombre FROM categorias';
    connection.query(query, (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ error: 'Error al obtener categorías' });
      }
      res.status(200).json(results);
    });
  });
});

// Get all providers
router.get('/proveedores', (req, res) => {
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

    const query = 'SELECT id, nombre FROM proveedores';
    connection.query(query, (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching providers:', err);
        return res.status(500).json({ error: 'Error al obtener proveedores' });
      }
      res.status(200).json(results);
    });
  });
});

// Create new category with duplicate check
router.post('/categorias', (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
  }

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

    // Check for duplicate (case-insensitive)
    const checkQuery = 'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)';
    connection.query(checkQuery, [nombre], (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking category:', err);
        return res.status(500).json({ error: 'Error al verificar categoría' });
      }

      if (results.length > 0) {
        connection.end();
        return res.status(400).json({ message: 'La categoría ya existe' });
      }

      // Insert new category
      const insertQuery = 'INSERT INTO categorias (nombre) VALUES (?)';
      connection.query(insertQuery, [nombre], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error creating category:', err);
          return res.status(500).json({ error: 'Error al crear categoría' });
        }
        res.status(201).json({ id: result.insertId, nombre });
      });
    });
  });
});

// Create new provider
router.post('/proveedores', (req, res) => {
  const { nombre, contacto } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
  }

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

    const query = 'INSERT INTO proveedores (nombre, contacto) VALUES (?, ?)';
    connection.query(query, [nombre, contacto], (err, result) => {
      connection.end();
      if (err) {
        console.error('Error creating provider:', err);
        return res.status(500).json({ error: 'Error al crear proveedor' });
      }
      res.status(201).json({ id: result.insertId, nombre, contacto });
    });
  });
});

// Get category by ID
router.get('/categorias/:id', (req, res) => {
  const { id } = req.params;

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

    const query = 'SELECT id, nombre FROM categorias WHERE id = ?';
    connection.query(query, [id], (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching category:', err);
        return res.status(500).json({ error: 'Error al obtener categoría' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json(results[0]);
    });
  });
});

// Check product code uniqueness
router.get('/productos/check-code', (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'El código es requerido' });
  }

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

    const query = 'SELECT id FROM productos WHERE codigo = ?';
    connection.query(query, [code], (err, results) => {
      connection.end();
      if (err) {
        console.error('Error checking code:', err);
        return res.status(500).json({ error: 'Error al verificar código' });
      }
      res.status(200).json(results.length === 0);
    });
  });
});

// Update POST /productos to include codigo
router.post('/productos', (req, res) => {
  const { codigo, nombre, categoria_id, precio, cantidad, proveedor_id, fecha } = req.body;

  if (!codigo || !nombre || !categoria_id || !precio || !cantidad || !fecha) {
    return res.status(400).json({ message: 'Todos los campos son requeridos, excepto proveedor_id' });
  }

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

    // Check if code is unique
    const checkQuery = 'SELECT id FROM productos WHERE codigo = ?';
    connection.query(checkQuery, [codigo], (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking code:', err);
        return res.status(500).json({ error: 'Error al verificar código' });
      }

      if (results.length > 0) {
        connection.end();
        return res.status(400).json({ message: 'El código ya existe' });
      }

      const query = `
        INSERT INTO productos (codigo, nombre, categoria_id, precio, cantidad, proveedor_id, fecha, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')
      `;
      connection.query(query, [codigo, nombre, categoria_id, precio, cantidad, proveedor_id, fecha], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error creating product:', err);
          return res.status(500).json({ error: 'Error al crear producto' });
        }
        res.status(201).json({ id: result.insertId });
      });
    });
  });
});

// Update a product
router.patch('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, proveedor_id } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ message: 'Nombre y precio son requeridos' });
  }

  // Validate precio as a positive integer
  const parsedPrecio = parseInt(precio);
  if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
    return res.status(400).json({ message: 'El precio debe ser un número entero mayor a 0' });
  }

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

    // Check if product exists and is active
    const checkQuery = 'SELECT estado FROM productos WHERE id = ?';
    connection.query(checkQuery, [id], (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking product:', err);
        return res.status(500).json({ error: 'Error al verificar producto' });
      }

      if (results.length === 0) {
        connection.end();
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (results[0].estado !== 'activo') {
        connection.end();
        return res.status(400).json({ message: 'Solo se pueden editar productos activos' });
      }

      // Update product
      const updateQuery = `
        UPDATE productos 
        SET nombre = ?, precio = ?, proveedor_id = ?
        WHERE id = ?
      `;
      connection.query(updateQuery, [nombre, parsedPrecio, proveedor_id, id], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error updating product:', err);
          return res.status(500).json({ error: 'Error al actualizar producto' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto actualizado correctamente' });
      });
    });
  });
});

// Deactivate a product
router.patch('/productos/:id/desactivar', (req, res) => {
  const { id } = req.params;

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

    // Check if product exists and is active
    const checkQuery = 'SELECT estado FROM productos WHERE id = ?';
    connection.query(checkQuery, [id], (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking product:', err);
        return res.status(500).json({ error: 'Error al verificar producto' });
      }

      if (results.length === 0) {
        connection.end();
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (results[0].estado !== 'activo') {
        connection.end();
        return res.status(400).json({ message: 'El producto ya está inactivo' });
      }

      // Update product state to inactivo
      const updateQuery = 'UPDATE productos SET estado = ? WHERE id = ?';
      connection.query(updateQuery, ['inactivo', id], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error deactivating product:', err);
          return res.status(500).json({ error: 'Error al desactivar producto' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto desactivado correctamente' });
      });
    });
  });
});

// Activate a product
router.patch('/productos/:id/activar', (req, res) => {
  const { id } = req.params;

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

    // Check if product exists and is inactive
    const checkQuery = 'SELECT estado FROM productos WHERE id = ?';
    connection.query(checkQuery, [id], (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking product:', err);
        return res.status(500).json({ error: 'Error al verificar producto' });
      }

      if (results.length === 0) {
        connection.end();
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (results[0].estado !== 'inactivo') {
        connection.end();
        return res.status(400).json({ message: 'El producto ya está activo' });
      }

      // Update product state to activo
      const updateQuery = 'UPDATE productos SET estado = ? WHERE id = ?';
      connection.query(updateQuery, ['activo', id], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error activating product:', err);
          return res.status(500).json({ error: 'Error al activar producto' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto activado correctamente' });
      });
    });
  });
});

module.exports = router;