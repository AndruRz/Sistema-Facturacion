const db = require('../config/db');

const productosController = {
  initTables: (connection) => {
    // Crear tabla categorias
    const createCategoriasTable = `
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    connection.query(createCategoriasTable, (err) => {
      if (err) {
        console.error('Error creando la tabla categorias:', err);
        return;
      }

    });

    // Crear tabla proveedores
    const createProveedoresTable = `
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        contacto VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (nombre, contacto)
      )
    `;
    connection.query(createProveedoresTable, (err) => {
      if (err) {
        console.error('Error creando la tabla proveedores:', err);
        return;
      }

    });

    // TABLA CORREGIDA: Crear tabla productos - PERMITE cantidad = 0
    const createProductosTable = `
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(20) NOT NULL UNIQUE,
        nombre VARCHAR(100) NOT NULL,
        categoria_id INT NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        cantidad INT NOT NULL CHECK (cantidad >= 0),
        proveedor_id INT DEFAULT NULL,
        fecha DATE,
        estado ENUM('activo', 'inactivo') DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      )
    `;
    connection.query(createProductosTable, (err) => {
      if (err) {
        console.error('Error creando la tabla productos:', err);
        return;
      }

    });

    // IMPORTANTE: Si la tabla ya existe, necesitas modificar el constraint
    // Ejecutar este comando para quitar el constraint anterior y añadir el nuevo
    const alterTableQuery = `
      ALTER TABLE productos 
      DROP CHECK productos_chk_1,
      ADD CONSTRAINT productos_cantidad_check CHECK (cantidad >= 0)
    `;
    
    connection.query(alterTableQuery, (err) => {
      if (err) {
        // Si el constraint no existe o ya está correcto, ignorar este error
      } else {
      }
    });
  },

  getAllProductos: (req, res) => {
    db.initializeConnection((err, connection) => {
      if (err) {
        return res.status(500).json({ error: 'Error conectando a la base de datos' });
      }
      connection.query('SELECT * FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id LEFT JOIN proveedores pr ON p.proveedor_id = pr.id', (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener productos' });
        }
        res.json(results);
      });
    });
  }
};

module.exports = productosController;