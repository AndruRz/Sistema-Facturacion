const db = require('../config/db');

const inventoryController = {
  initTables: (connection) => {
    // Crear tabla ingresos_mercancia
    const createIngresosMercanciaTable = `
      CREATE TABLE IF NOT EXISTS ingresos_mercancia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        proveedor_id INT,
        unidades_nuevas INT NOT NULL CHECK (unidades_nuevas > 0),
        producto_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `;
    connection.query(createIngresosMercanciaTable, (err) => {
      if (err) {
        console.error('Error creando la tabla ingresos_mercancia:', err);
        return;
      }
    });

    // Crear tabla salidas_mercancia
    const createSalidasMercanciaTable = `
      CREATE TABLE IF NOT EXISTS salidas_mercancia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        unidades_descontadas INT NOT NULL CHECK (unidades_descontadas > 0),
        razon_descuento VARCHAR(255) NOT NULL,
        producto_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `;
    connection.query(createSalidasMercanciaTable, (err) => {
      if (err) {
        console.error('Error creando la tabla salidas_mercancia:', err);
        return;
      }
    });
  },

  // Método para agregar unidades nuevas
  addUnits: (req, res) => {
    const { producto_id, unidades_nuevas, fecha, proveedor_id } = req.body;

    if (!producto_id || !unidades_nuevas || !fecha) {
      return res.status(400).json({ message: 'Producto ID, unidades nuevas y fecha son requeridos' });
    }

    if (unidades_nuevas <= 0) {
      return res.status(400).json({ message: 'Las unidades nuevas deben ser mayores a 0' });
    }

    db.initializeConnection((err, connection) => {
      if (err) {
        return res.status(500).json({ error: 'Error conectando a la base de datos' });
      }

      // Verificar que el producto existe y está activo
      connection.query('SELECT cantidad, estado FROM productos WHERE id = ?', [producto_id], (err, results) => {
        if (err) {
          connection.end();
          return res.status(500).json({ error: 'Error al verificar producto' });
        }

        if (results.length === 0) {
          connection.end();
          return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (results[0].estado !== 'activo') {
          connection.end();
          return res.status(400).json({ message: 'El producto no está activo' });
        }

        // Iniciar transacción
        connection.beginTransaction((err) => {
          if (err) {
            connection.end();
            return res.status(500).json({ error: 'Error iniciando transacción' });
          }

          // Insertar ingreso en ingresos_mercancia
          const insertQuery = 'INSERT INTO ingresos_mercancia (producto_id, unidades_nuevas, fecha, proveedor_id) VALUES (?, ?, ?, ?)';
          connection.query(insertQuery, [producto_id, unidades_nuevas, fecha, proveedor_id || null], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.end();
                return res.status(500).json({ error: 'Error al registrar ingreso' });
              });
            }

            // Actualizar cantidad en productos
            const updateQuery = 'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?';
            connection.query(updateQuery, [unidades_nuevas, producto_id], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.end();
                  return res.status(500).json({ error: 'Error al actualizar cantidad' });
                });
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.end();
                    return res.status(500).json({ error: 'Error al confirmar transacción' });
                  });
                }
                connection.end();
                res.status(200).json({ message: 'Unidades agregadas correctamente' });
              });
            });
          });
        });
      });
    });
  },

  // Método para descontar unidades - CORREGIDO
  discountUnits: (req, res) => {
    const { producto_id, unidades_descontadas, fecha, razon_descuento } = req.body;

    if (!producto_id || !unidades_descontadas || !fecha || !razon_descuento) {
      return res.status(400).json({ message: 'Producto ID, unidades descontadas, fecha y razón son requeridos' });
    }

    if (unidades_descontadas <= 0) {
      return res.status(400).json({ message: 'Las unidades descontadas deben ser mayores a 0' });
    }

    db.initializeConnection((err, connection) => {
      if (err) {
        return res.status(500).json({ error: 'Error conectando a la base de datos' });
      }

      // Verificar que el producto existe y está activo
      connection.query('SELECT cantidad, estado, nombre FROM productos WHERE id = ?', [producto_id], (err, results) => {
        if (err) {
          connection.end();
          return res.status(500).json({ error: 'Error al verificar producto' });
        }

        if (results.length === 0) {
          connection.end();
          return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (results[0].estado !== 'activo') {
          connection.end();
          return res.status(400).json({ message: 'El producto no está activo' });
        }

        const currentCantidad = results[0].cantidad;
        const productName = results[0].nombre;
        const requestedQuantity = unidades_descontadas;

        // CAMBIO AQUÍ: Solo permitir descuento si hay stock disponible
        // Si el stock actual es 0, no permitir más descuentos
        if (currentCantidad === 0) {
          connection.end();
          return res.status(400).json({ 
            message: `No puedes descontar unidades del producto "${productName}" porque ya está en 0. Alimenta el inventario primero.` 
          });
        }

        // Si el descuento solicitado es mayor al stock disponible, no permitir
        if (currentCantidad < requestedQuantity) {
          connection.end();
          return res.status(400).json({ 
            message: `No puedes descontar ${requestedQuantity} unidades del producto "${productName}". Solo tienes ${currentCantidad} unidades disponibles.` 
          });
        }

        // Iniciar transacción
        connection.beginTransaction((err) => {
          if (err) {
            connection.end();
            return res.status(500).json({ error: 'Error iniciando transacción' });
          }

          // Insertar salida en salidas_mercancia
          const insertQuery = 'INSERT INTO salidas_mercancia (producto_id, unidades_descontadas, fecha, razon_descuento) VALUES (?, ?, ?, ?)';
          connection.query(insertQuery, [producto_id, unidades_descontadas, fecha, razon_descuento], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.end();
                return res.status(500).json({ error: 'Error al registrar salida' });
              });
            }

            // Actualizar cantidad en productos - SIMPLIFICADO
            const updateQuery = 'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?';
            connection.query(updateQuery, [unidades_descontadas, producto_id], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.end();
                  return res.status(500).json({ error: 'Error al actualizar cantidad' });
                });
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.end();
                    return res.status(500).json({ error: 'Error al confirmar transacción' });
                  });
                }
                connection.end();
                
                const newQuantity = currentCantidad - requestedQuantity;
                const message = newQuantity === 0 
                  ? `Unidades descontadas correctamente. El producto "${productName}" ahora está en 0 unidades.`
                  : `Unidades descontadas correctamente. Quedan ${newQuantity} unidades del producto "${productName}".`;
                
                res.status(200).json({ message });
              });
            });
          });
        });
      });
    });
  }
};

module.exports = inventoryController;