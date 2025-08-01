const db = require('../config/db');

const facturacionController = {
  initTables: async (connection) => {
    try {
      // Crear tabla medios_pago
      const createMediosPagoTable = `
        CREATE TABLE IF NOT EXISTS medios_pago (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50) NOT NULL,
          descripcion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createMediosPagoTable, (err) => {
          if (err) {
            console.error('Error creando la tabla medios_pago:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Crear tabla clientes
      const createClientesTable = `
        CREATE TABLE IF NOT EXISTS clientes (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          telefono VARCHAR(20),
          email VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createClientesTable, (err) => {
          if (err) {
            console.error('Error creando la tabla clientes:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Crear tabla factura
      const createFacturaTable = `
        CREATE TABLE IF NOT EXISTS factura (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          fecha DATETIME NOT NULL,
          cliente_id BIGINT,  -- Campo opcional, referencia a clientes.id
          vendedor_id INT,    -- Campo opcional, referencia a usuarios.id
          total DECIMAL(15,2) NOT NULL,
          estado ENUM('activa', 'anulada', 'parcialmente_devuelta') DEFAULT 'activa',
          numero VARCHAR(10) DEFAULT 'NUV-00000',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
          FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createFacturaTable, (err) => {
          if (err) {
            console.error('Error creando la tabla factura:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Crear tabla detalle_factura
      const createDetalleFacturaTable = `
        CREATE TABLE IF NOT EXISTS detalle_factura (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          factura_id BIGINT NOT NULL,
          producto_id INT NOT NULL,  -- Coincide con productos.id
          cantidad INT NOT NULL CHECK (cantidad > 0),
          precio_unitario DECIMAL(15,2) NOT NULL,
          subtotal DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (factura_id) REFERENCES factura(id) ON DELETE CASCADE,
          FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createDetalleFacturaTable, (err) => {
          if (err) {
            console.error('Error creando la tabla detalle_factura:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Crear tabla factura_medio_pago
      const createFacturaMedioPagoTable = `
        CREATE TABLE IF NOT EXISTS factura_medio_pago (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          factura_id BIGINT NOT NULL,
          medio_pago_id INT NOT NULL,
          monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (factura_id) REFERENCES factura(id) ON DELETE CASCADE,
          FOREIGN KEY (medio_pago_id) REFERENCES medios_pago(id) ON DELETE RESTRICT
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createFacturaMedioPagoTable, (err) => {
          if (err) {
            console.error('Error creando la tabla factura_medio_pago:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Crear tabla devoluciones (actualizada para coincidir con la estructura corregida)
      const createDevolucionesTable = `
        CREATE TABLE IF NOT EXISTS devoluciones (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          factura_id BIGINT NOT NULL,
          detalle_factura_id BIGINT NOT NULL,
          producto_id INT NOT NULL,  -- Coincide con productos.id (INT)
          cantidad INT NOT NULL CHECK (cantidad > 0),
          razon TEXT NOT NULL,
          fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (factura_id) REFERENCES factura(id) ON DELETE CASCADE,
          FOREIGN KEY (detalle_factura_id) REFERENCES detalle_factura(id) ON DELETE CASCADE,
          FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
        )
      `;
      await new Promise((resolve, reject) => {
        connection.query(createDevolucionesTable, (err) => {
          if (err) {
            console.error('Error creando la tabla devoluciones:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw new Error('Error inicializando las tablas de facturación: ' + error.message);
    }
  }
};

module.exports = facturacionController;