const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const { sendInvoiceEmail } = require('../utils/email');
const { generateInvoicePDF, generateCanceledInvoicePDF } = require('../utils/pdf_factura');

dotenv.config();

// Ajustar la ruta para que apunte a la carpeta data en la raíz del proyecto
const invoiceNumberFile = path.join(__dirname, '..', 'data', 'numero_factura.json');

// Get all invoices with optional filters
router.get('/facturacion', (req, res) => {
    const { search, startDate, endDate, medioPago } = req.query;

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
                f.id, f.numero, f.fecha, f.total, f.estado,
                GROUP_CONCAT(mp.nombre) AS medios_pago
            FROM factura f
            LEFT JOIN factura_medio_pago fmp ON f.id = fmp.factura_id
            LEFT JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
            WHERE f.estado = 'activa'
        `;
        const queryParams = [];

        if (search) {
            query += ' AND (f.numero LIKE ? OR f.id LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (startDate) {
            query += ' AND DATE(f.fecha) >= ?';
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(f.fecha) <= ?';
            queryParams.push(endDate);
        }
        if (medioPago) {
            query += ' AND fmp.medio_pago_id = ?';
            queryParams.push(medioPago);
        }

        query += ' GROUP BY f.id, f.numero, f.fecha, f.total, f.estado ORDER BY f.fecha DESC';

        connection.query(query, queryParams, (err, results) => {
            connection.end();
            if (err) {
                console.error('Error fetching invoices:', err);
                return res.status(500).json({ error: 'Error al obtener facturas' });
            }
            res.status(200).json(results);
        });
    });
});

// Get summary data for today
router.get('/facturacion/resumen', (req, res) => {
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

    const summary = { facturas_hoy: 0, productos_vendidos: 0, ingresos_hoy: 0 };

    const facturasQuery = `SELECT COUNT(*) AS facturas_hoy FROM factura WHERE DATE(fecha) = CURDATE() AND estado = 'activa'`;
    connection.query(facturasQuery, (err, results) => {
      if (err) {
        console.error('Error fetching facturas_hoy:', err);
        connection.end();
        return res.status(500).json({ error: 'Error al obtener facturas de hoy' });
      }
      summary.facturas_hoy = results[0].facturas_hoy || 0;

      const productosQuery = `
        SELECT SUM(df.cantidad) AS productos_vendidos
        FROM detalle_factura df
        JOIN factura f ON df.factura_id = f.id
        WHERE DATE(f.fecha) = CURDATE() AND f.estado = 'activa'
      `;
      connection.query(productosQuery, (err, results) => {
        if (err) {
          console.error('Error fetching productos_vendidos:', err);
          connection.end();
          return res.status(500).json({ error: 'Error al obtener productos vendidos' });
        }
        summary.productos_vendidos = results[0].productos_vendidos || 0;

        const ingresosQuery = `SELECT SUM(total) AS ingresos_hoy FROM factura WHERE DATE(fecha) = CURDATE() AND estado = 'activa'`;
        connection.query(ingresosQuery, (err, results) => {
          connection.end();
          if (err) {
            console.error('Error fetching ingresos_hoy:', err);
            return res.status(500).json({ error: 'Error al obtener ingresos de hoy' });
          }
          summary.ingresos_hoy = results[0].ingresos_hoy || 0;
          res.status(200).json(summary);
        });
      });
    });
  });
});

// Get the last invoice numbers from file
router.get('/get-last-invoice-number', async (req, res) => {
  try {
    const data = await fs.readFile(invoiceNumberFile, 'utf8');
    const jsonData = JSON.parse(data);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error('Error reading invoice number file:', error);
    // Devolver valores predeterminados si el archivo no existe o hay error
    res.status(200).json({ lastNUV: 'NUV-00000', lastANT: 'ANT-00000' });
  }
});

// Save the last invoice number to file
router.post('/save-invoice-number', async (req, res) => {
  const { lastNumber } = req.body;
  if (!lastNumber) {
    return res.status(400).json({ error: 'El número de factura es obligatorio' });
  }

  try {
    // Leer los valores actuales del archivo
    let currentData = { lastNUV: 'NUV-00000', lastANT: 'ANT-00000' };
    try {
      const data = await fs.readFile(invoiceNumberFile, 'utf8');
      currentData = JSON.parse(data);
    } catch (readError) {
      console.error('Error reading current invoice numbers, using defaults:', readError);
    }

    // Actualizar el contador correspondiente según el prefijo
    if (lastNumber.startsWith('NUV')) {
      currentData.lastNUV = lastNumber;
    } else if (lastNumber.startsWith('ANT')) {
      currentData.lastANT = lastNumber;
    }

    // Guardar ambos contadores en el archivo
    await fs.writeFile(invoiceNumberFile, JSON.stringify(currentData, null, 2));
    res.status(200).json({ message: 'Invoice numbers saved' });
  } catch (error) {
    console.error('Error saving invoice number:', error);
    res.status(500).json({ error: 'Error saving invoice number' });
  }
});

// Get all products with optional filters (only active products)
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
        p.proveedor_id,
        c.nombre AS categoria_nombre,
        pr.nombre AS proveedor_nombre,
        p.fecha,
        p.created_at
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.estado = 'activo'
    `;
    const queryParams = [];

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

    const query = `SELECT id, nombre FROM categorias ORDER BY nombre ASC`;
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

// Get all clients with optional search
router.get('/clientes', (req, res) => {
  const { search } = req.query;

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

    let query = `SELECT id, nombre, telefono, email FROM clientes`;
    const queryParams = [];

    if (search) {
      query += ` WHERE nombre LIKE ? OR telefono LIKE ? OR email LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY nombre ASC`;

    connection.query(query, queryParams, (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching clients:', err);
        return res.status(500).json({ error: 'Error al obtener clientes' });
      }
      res.status(200).json(results);
    });
  });
});

// Create a new client
router.post('/clientes', (req, res) => {
  const { nombre, telefono, email } = req.body;
  
  if (!nombre || !telefono) {
    return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
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
    
    // Check for duplicates
    let checkQuery = 'SELECT telefono, email FROM clientes WHERE telefono = ?';
    let checkParams = [telefono];
    
    if (email) {
      checkQuery += ' OR email = ?';
      checkParams.push(email);
    }
    
    connection.query(checkQuery, checkParams, (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking duplicates:', err);
        return res.status(500).json({ error: 'Error al validar los datos' });
      }
      
      // Check for all possible duplicates
      const duplicatePhone = results.find(row => row.telefono === telefono);
      const duplicateEmail = email ? results.find(row => row.email === email) : null;
      
      // Build error message for multiple duplicates
      let errorMessages = [];
      let duplicateFields = [];
      
      if (duplicatePhone) {
        errorMessages.push('el número de teléfono ya está registrado');
        duplicateFields.push('telefono');
      }
      
      if (duplicateEmail) {
        errorMessages.push('el correo electrónico ya está registrado');
        duplicateFields.push('email');
      }
      
      if (errorMessages.length > 0) {
        connection.end();
        
        let finalMessage;
        if (errorMessages.length === 1) {
          finalMessage = errorMessages[0].charAt(0).toUpperCase() + errorMessages[0].slice(1);
        } else {
          finalMessage = 'El ' + errorMessages.join(' y ') + '. Por favor ingrese datos diferentes.';
        }
        
        return res.status(409).json({ 
          error: finalMessage,
          fields: duplicateFields,
          duplicates: {
            telefono: !!duplicatePhone,
            email: !!duplicateEmail
          }
        });
      }
      
      // If no duplicates, proceed with insertion
      const insertQuery = `INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)`;
      connection.query(insertQuery, [nombre, telefono, email], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error creating client:', err);
          return res.status(500).json({ error: 'Error al crear el cliente' });
        }
        res.status(201).json({ id: result.insertId, nombre });
      });
    });
  });
});

// Update an existing client (PUT /clientes/:id)
router.put('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email } = req.body;

  if (!nombre || !telefono) {
    return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
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

    // Check for duplicates, excluding the current client ID
    let checkQuery = 'SELECT telefono, email FROM clientes WHERE (telefono = ? OR email = ?) AND id != ?';
    let checkParams = [telefono, email || null, id];

    connection.query(checkQuery, checkParams, (err, results) => {
      if (err) {
        connection.end();
        console.error('Error checking duplicates:', err);
        return res.status(500).json({ error: 'Error al validar los datos' });
      }

      // Check for duplicates
      const duplicatePhone = results.find(row => row.telefono === telefono);
      const duplicateEmail = email ? results.find(row => row.email === email) : null;

      // Build error message for duplicates
      let errorMessages = [];
      let duplicateFields = [];

      if (duplicatePhone) {
        errorMessages.push('el número de teléfono ya está registrado');
        duplicateFields.push('telefono');
      }

      if (duplicateEmail) {
        errorMessages.push('el correo electrónico ya está registrado');
        duplicateFields.push('email');
      }

      if (errorMessages.length > 0) {
        connection.end();
        let finalMessage;
        if (errorMessages.length === 1) {
          finalMessage = errorMessages[0].charAt(0).toUpperCase() + errorMessages[0].slice(1);
        } else {
          finalMessage = 'El ' + errorMessages.join(' y ') + '. Por favor ingrese datos diferentes.';
        }
        return res.status(409).json({
          error: finalMessage,
          fields: duplicateFields,
          duplicates: {
            telefono: !!duplicatePhone,
            email: !!duplicateEmail
          }
        });
      }

      // Update the client
      const updateQuery = `UPDATE clientes SET nombre = ?, telefono = ?, email = ? WHERE id = ?`;
      connection.query(updateQuery, [nombre, telefono, email, id], (err, result) => {
        connection.end();
        if (err) {
          console.error('Error updating client:', err);
          return res.status(500).json({ error: 'Error al actualizar el cliente' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente actualizado' });
      });
    });
  });
});

// Save invoice and update product stock
router.post('/factura', async (req, res) => {
  const { fecha, numeroFactura, clienteId, vendedorId, productos, descuentos, mediosDePago, montoTotal } = req.body;

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: 'Debe haber al menos un producto en la factura' });
  }
  if (!vendedorId) {
    return res.status(400).json({ error: 'El ID del vendedor es obligatorio' });
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

    connection.beginTransaction(async (err) => {
      if (err) {
        connection.end();
        return res.status(500).json({ error: 'Error al iniciar la transacción' });
      }

      try {
        // Verificar si el número de factura ya existe
        let finalInvoiceNumber = numeroFactura;
        let numberExists = true;
        let attempt = 0;
        const prefix = numeroFactura.startsWith('NUV') ? 'NUV' : 'ANT';
        let currentNumber = parseInt(numeroFactura.replace(prefix, '').replace('-', '')) || 0;

        while (numberExists && attempt < 100) {
          const checkQuery = `SELECT id FROM factura WHERE numero = ? LIMIT 1`;
          const checkResult = await new Promise((resolve, reject) => {
            connection.query(checkQuery, [finalInvoiceNumber], (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          if (checkResult.length > 0) {
            currentNumber++;
            finalInvoiceNumber = `${prefix}-${currentNumber.toString().padStart(5, '0')}`;
            attempt++;
          } else {
            numberExists = false;
          }
        }

        if (numberExists) {
          throw new Error('No se pudo generar un número de factura único después de varios intentos');
        }

        // Actualizar el JSON con el nuevo número
        let currentData = { lastNUV: 'NUV-00000', lastANT: 'ANT-00000' };
        try {
          const data = await fs.readFile(invoiceNumberFile, 'utf8');
          currentData = JSON.parse(data);
        } catch (readError) {
          console.error('Error reading invoice numbers, using defaults:', readError);
        }

        if (finalInvoiceNumber.startsWith('NUV')) {
          currentData.lastNUV = finalInvoiceNumber;
        } else if (finalInvoiceNumber.startsWith('ANT')) {
          currentData.lastANT = finalInvoiceNumber;
        }

        await fs.writeFile(invoiceNumberFile, JSON.stringify(currentData, null, 2));

        // Verificar el stock de cada producto antes de actualizar
        for (const producto of productos) {
          const stockQuery = `SELECT cantidad, nombre FROM productos WHERE id = ?`;
          const stockResult = await new Promise((resolve, reject) => {
            connection.query(stockQuery, [producto.id], (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          if (stockResult.length === 0) {
            throw new Error(`Producto con ID ${producto.id} no encontrado`);
          }

          const currentStock = stockResult[0].cantidad;
          const productName = stockResult[0].nombre;
          const requestedQuantity = producto.cantidad;

          if (currentStock < requestedQuantity) {
            throw new Error(`No hay suficiente stock del producto "${productName}". Stock disponible: ${currentStock}, cantidad solicitada: ${requestedQuantity}. Alimenta el inventario.`);
          }

          if (currentStock - requestedQuantity === 0) {
            console.warn(`⚠️  ADVERTENCIA: El producto "${productName}" va a quedar en 0 unidades después de esta venta.`);
          }
        }

        // Guardar la factura
        const facturaQuery = `INSERT INTO factura (fecha, cliente_id, vendedor_id, total, numero) VALUES (?, ?, ?, ?, ?)`;
        const facturaResult = await new Promise((resolve, reject) => {
          connection.query(facturaQuery, [fecha, clienteId, vendedorId, montoTotal, finalInvoiceNumber], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        const facturaId = facturaResult.insertId;

        // Guardar detalles de la factura en detalle_factura
        for (const producto of productos) {
          const detalleQuery = `
            INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
          `;
          const precioUnitario = parseFloat(producto.precioUnitario);
          const subtotal = parseFloat(producto.subtotal);
          if (isNaN(precioUnitario) || isNaN(subtotal)) {
            throw new Error(`Datos inválidos para el producto ID ${producto.id}: precioUnitario=${producto.precioUnitario}, subtotal=${producto.subtotal}`);
          }
          await new Promise((resolve, reject) => {
            connection.query(detalleQuery, [
              facturaId,
              producto.id,
              producto.cantidad,
              precioUnitario,
              subtotal
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Actualizar el stock de los productos
        for (const producto of productos) {
          const updateStockQuery = `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`;
          await new Promise((resolve, reject) => {
            connection.query(updateStockQuery, [producto.cantidad, producto.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Guardar medios de pago
        for (const medio of mediosDePago) {
          const medioPagoQuery = `SELECT id FROM medios_pago WHERE nombre = ? LIMIT 1`;
          const medioPagoResult = await new Promise((resolve, reject) => {
            connection.query(medioPagoQuery, [medio.metodo], (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          let medioPagoId = medioPagoResult[0]?.id;
          if (!medioPagoId) {
            const insertMedioQuery = `INSERT INTO medios_pago (nombre) VALUES (?)`;
            const insertMedioResult = await new Promise((resolve, reject) => {
              connection.query(insertMedioQuery, [medio.metodo], (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            medioPagoId = insertMedioResult.insertId;
          }

          const facturaMedioPagoQuery = `INSERT INTO factura_medio_pago (factura_id, medio_pago_id, monto) VALUES (?, ?, ?)`;
          await new Promise((resolve, reject) => {
            connection.query(facturaMedioPagoQuery, [facturaId, medioPagoId, medio.monto], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Fetch client details if clientId is provided
        let clientEmail = null;
        let clientName = 'Cliente';
        if (clienteId) {
          const clientQuery = `SELECT nombre, email FROM clientes WHERE id = ?`;
          const clientResult = await new Promise((resolve, reject) => {
            connection.query(clientQuery, [clienteId], (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          if (clientResult.length > 0) {
            clientName = clientResult[0].nombre;
            clientEmail = clientResult[0].email;
          }
        }

        // Generate and save PDF
        let pdfPath = null;
        try {
          pdfPath = await generateInvoicePDF({
            numeroFactura: finalInvoiceNumber,
            fecha,
            clienteId,
            vendedorId,
            productos,
            descuentos,
            mediosDePago,
            montoTotal
          }, clientName);
        } catch (pdfError) {
          console.error('Failed to generate PDF, but invoice was saved:', pdfError);
          // Don't fail the request due to PDF error
        }

        // Commit the transaction
        connection.commit(async (err) => {
          if (err) {
            connection.rollback(() => {
              connection.end();
              return res.status(500).json({ error: 'Error al guardar la factura' });
            });
          }

          // Send email if client has an email address
          if (clientEmail) {
            try {
              await sendInvoiceEmail(clientEmail, clientName, {
                numeroFactura: finalInvoiceNumber,
                fecha,
                clienteId,
                vendedorId,
                productos,
                descuentos,
                mediosDePago,
                montoTotal
              });
            } catch (emailError) {
              console.error('Failed to send email, but invoice was saved:', emailError);
              // Don't fail the request due to email error
            }
          }

          connection.end();
          res.status(201).json({
            id: facturaId,
            numeroFactura: finalInvoiceNumber,
            fecha,
            clienteId,
            vendedorId,
            productos,
            descuentos,
            mediosDePago,
            montoTotal,
            pdfPath: pdfPath ? `/api/factura/pdf/${facturaId}` : null
          });
        });
      } catch (error) {
        connection.rollback(() => {
          connection.end();
          console.error('Error al guardar la factura:', error);
          res.status(500).json({ error: error.message || 'Error al guardar la factura' });
        });
      }
    });
  });
});

// Serve invoice PDF
router.get('/factura/pdf/:id', async (req, res) => {
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

    const query = `SELECT numero, fecha FROM factura WHERE id = ?`;
    connection.query(query, [id], async (err, results) => {
      if (err) {
        connection.end();
        console.error('Error fetching invoice:', err);
        return res.status(500).json({ error: 'Error al buscar la factura' });
      }

      if (results.length === 0) {
        connection.end();
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      const { numero, fecha } = results[0];
      const date = new Date(fecha);
      const year = date.getFullYear();
      const month = date.toLocaleString('es-CO', { month: 'long' });
      const day = String(date.getDate()).padStart(2, '0');
      const filePath = path.join(__dirname, '..', 'Facturas', `Año ${year}`, `Mes ${month}`, `Dia ${day}`, `${numero}.pdf`);

      connection.end();

      try {
        await fs.access(filePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${numero}.pdf`);
        res.sendFile(filePath);
      } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(404).json({ error: 'Archivo PDF no encontrado' });
      }
    });
  });
});

// Get invoice details by ID
router.get('/factura/:id', (req, res) => {
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

        const invoiceQuery = `
            SELECT 
                f.id, f.numero, f.fecha, f.total AS montoTotal, f.cliente_id,
                c.nombre, c.telefono, c.email, f.estado
            FROM factura f
            LEFT JOIN clientes c ON f.cliente_id = c.id
            WHERE f.id = ?
        `;
        connection.query(invoiceQuery, [id], (err, invoiceResults) => {
            if (err) {
                connection.end();
                console.error('Error fetching invoice:', err);
                return res.status(500).json({ error: 'Error al obtener la factura' });
            }
            if (invoiceResults.length === 0) {
                connection.end();
                return res.status(404).json({ error: 'Factura no encontrada o no está disponible' });
            }

            const invoice = invoiceResults[0];
            const productsQuery = `
                SELECT 
                    df.id AS detalle_id,
                    df.producto_id, df.cantidad, df.precio_unitario AS precioUnitario, 
                    df.subtotal, p.codigo, p.nombre
                FROM detalle_factura df
                JOIN productos p ON df.producto_id = p.id
                WHERE df.factura_id = ?
            `;
            connection.query(productsQuery, [id], (err, productResults) => {
                if (err) {
                    connection.end();
                    console.error('Error fetching products:', err);
                    return res.status(500).json({ error: 'Error al obtener productos' });
                }

                const paymentsQuery = `
                    SELECT mp.nombre AS metodo, fmp.monto
                    FROM factura_medio_pago fmp
                    JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                    WHERE fmp.factura_id = ?
                `;
                connection.query(paymentsQuery, [id], (err, paymentResults) => {
                    connection.end();
                    if (err) {
                        console.error('Error fetching payment methods:', err);
                        return res.status(500).json({ error: 'Error al obtener métodos de pago' });
                    }

                    res.status(200).json({
                        id: invoice.id,
                        numero: invoice.numero,
                        fecha: invoice.fecha,
                        montoTotal: invoice.montoTotal,
                        estado: invoice.estado,
                        cliente: invoice.cliente_id ? {
                            id: invoice.cliente_id,
                            nombre: invoice.nombre || 'N/A',
                            telefono: invoice.telefono || 'N/A',
                            email: invoice.email || null
                        } : null,
                        productos: productResults,
                        mediosDePago: paymentResults
                    });
                });
            });
        });
    });
});

// Send invoice email
router.post('/factura/:id/email', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
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

        const invoiceQuery = `
            SELECT 
                f.id, f.numero, f.fecha, f.total AS montoTotal, f.cliente_id, f.vendedor_id,
                c.nombre AS clienteNombre
            FROM factura f
            LEFT JOIN clientes c ON f.cliente_id = c.id
            WHERE f.id = ? AND f.estado = 'activa'
        `;
        connection.query(invoiceQuery, [id], async (err, invoiceResults) => {
            if (err) {
                connection.end();
                console.error('Error fetching invoice:', err);
                return res.status(500).json({ error: 'Error al obtener la factura' });
            }
            if (invoiceResults.length === 0) {
                connection.end();
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            const invoice = invoiceResults[0];
            const productsQuery = `
                SELECT 
                    df.producto_id, df.cantidad, df.precio_unitario AS precioUnitario, 
                    df.subtotal, p.codigo, p.nombre
                FROM detalle_factura df
                JOIN productos p ON df.producto_id = p.id
                WHERE df.factura_id = ?
            `;
            connection.query(productsQuery, [id], async (err, productResults) => {
                if (err) {
                    connection.end();
                    console.error('Error fetching products:', err);
                    return res.status(500).json({ error: 'Error al obtener productos' });
                }

                const paymentsQuery = `
                    SELECT mp.nombre AS metodo, fmp.monto
                    FROM factura_medio_pago fmp
                    JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                    WHERE fmp.factura_id = ?
                `;
                connection.query(paymentsQuery, [id], async (err, paymentResults) => {
                    connection.end();
                    if (err) {
                        console.error('Error fetching payment methods:', err);
                        return res.status(500).json({ error: 'Error al obtener métodos de pago' });
                    }

                    const invoiceDetails = {
                        numeroFactura: invoice.numero,
                        fecha: invoice.fecha,
                        clienteId: invoice.cliente_id,
                        vendedorId: invoice.vendedor_id,
                        productos: productResults,
                        descuentos: [], // Adjust if discounts are stored separately
                        mediosDePago: paymentResults,
                        montoTotal: invoice.montoTotal
                    };

                    try {
                        const pdfPath = await generateInvoicePDF(invoiceDetails, invoice.clienteNombre || 'Cliente');
                        await sendInvoiceEmail(email, invoice.clienteNombre || 'Cliente', invoiceDetails);
                        res.status(200).json({ message: 'Factura enviada por correo' });
                    } catch (error) {
                        console.error('Error sending invoice email:', error);
                        res.status(500).json({ error: 'Error al enviar la factura por correo' });
                    }
                });
            });
        });
    });
});

// Update invoice with a new client ID
router.patch('/factura/:id', (req, res) => {
    const { id } = req.params;
    const { cliente_id } = req.body;

    if (!cliente_id) {
        return res.status(400).json({ error: 'El ID del cliente es obligatorio' });
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

        const updateQuery = `UPDATE factura SET cliente_id = ? WHERE id = ? AND estado = 'activa'`;
        connection.query(updateQuery, [cliente_id, id], (err, result) => {
            connection.end();
            if (err) {
                console.error('Error updating invoice:', err);
                return res.status(500).json({ error: 'Error al actualizar la factura' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Factura no encontrada o no está activa' });
            }
            res.status(200).json({ message: 'Factura actualizada con nuevo cliente' });
        });
    });
});

// Get return history for a specific product in an invoice
router.get('/devoluciones/:factura_id/:producto_id', (req, res) => {
    const { factura_id, producto_id } = req.params;

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

        const query = `
            SELECT id, cantidad, razon, fecha
            FROM devoluciones
            WHERE factura_id = ? AND producto_id = ?
        `;
        connection.query(query, [factura_id, producto_id], (err, results) => {
            connection.end();
            if (err) {
                console.error('Error fetching returns:', err);
                return res.status(500).json({ error: 'Error al obtener devoluciones' });
            }
            res.status(200).json(results);
        });
    });
});

// Register a return and update stock
router.post('/devoluciones', (req, res) => {
    const { factura_id, detalle_factura_id, producto_id, cantidad, razon } = req.body;

    if (!factura_id || !detalle_factura_id || !producto_id || !cantidad || !razon) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (cantidad <= 0) {
        return res.status(400).json({ error: 'La cantidad a devolver debe ser mayor a 0' });
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

        connection.beginTransaction(async (err) => {
            if (err) {
                connection.end();
                return res.status(500).json({ error: 'Error al iniciar la transacción' });
            }

            try {
                // Verificar que el detalle_factura exista
                const purchaseQuery = `SELECT cantidad FROM detalle_factura WHERE id = ? AND factura_id = ?`;
                const purchaseResult = await new Promise((resolve, reject) => {
                    connection.query(purchaseQuery, [detalle_factura_id, factura_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (purchaseResult.length === 0) {
                    throw new Error('Detalle de factura no encontrado');
                }

                // Verificar el stock actual del producto
                const stockQuery = `SELECT cantidad FROM productos WHERE id = ? AND estado = 'activo'`;
                const stockResult = await new Promise((resolve, reject) => {
                    connection.query(stockQuery, [producto_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (stockResult.length === 0) {
                    throw new Error('Producto no encontrado');
                }

                const currentStock = stockResult[0].cantidad;
                if (currentStock < cantidad) {
                    throw new Error(`No hay suficiente stock para realizar la devolución. Stock actual: ${currentStock}`);
                }

                // Registrar la devolución
                const insertQuery = `
                    INSERT INTO devoluciones (factura_id, detalle_factura_id, producto_id, cantidad, razon, fecha)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `;
                const insertResult = await new Promise((resolve, reject) => {
                    connection.query(insertQuery, [factura_id, detalle_factura_id, producto_id, cantidad, razon], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Restar del inventario (dar un producto nuevo)
                const updateStockQuery = `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`;
                await new Promise((resolve, reject) => {
                    connection.query(updateStockQuery, [cantidad, producto_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.end();
                            return res.status(500).json({ error: 'Error al confirmar la devolución' });
                        });
                    }
                    connection.end();
                    res.status(201).json({ id: insertResult.insertId, message: 'Devolución registrada' });
                });
            } catch (error) {
                connection.rollback(() => {
                    connection.end();
                    console.error('Error al registrar la devolución:', error);
                    res.status(500).json({ error: error.message || 'Error al registrar la devolución' });
                });
            }
        });
    });
});

// Cancel an invoice, restore product stock, and replace PDF with canceled version
router.post('/cancelar-factura', (req, res) => {
    const { factura_id } = req.body;

    if (!factura_id) {
        return res.status(400).json({ error: 'El ID de la factura es obligatorio' });
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

        connection.beginTransaction(async (err) => {
            if (err) {
                connection.end();
                return res.status(500).json({ error: 'Error al iniciar la transacción' });
            }

            try {
                // Verificar que la factura existe y está activa
                const invoiceQuery = `
                    SELECT f.estado, f.numero, f.fecha, f.total AS montoTotal, f.cliente_id
                    FROM factura f
                    WHERE f.id = ?
                `;
                const invoiceResult = await new Promise((resolve, reject) => {
                    connection.query(invoiceQuery, [factura_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (invoiceResult.length === 0) {
                    throw new Error('Factura no encontrada');
                }
                if (invoiceResult[0].estado !== 'activa') {
                    throw new Error('Solo se pueden cancelar facturas activas');
                }

                const invoice = invoiceResult[0];

                // Obtener los detalles de los productos de la factura
                const productsQuery = `
                    SELECT 
                        df.producto_id, df.cantidad, df.precio_unitario AS precioUnitario, 
                        df.subtotal, p.codigo, p.nombre
                    FROM detalle_factura df
                    JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `;
                const productsResult = await new Promise((resolve, reject) => {
                    connection.query(productsQuery, [factura_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (productsResult.length === 0) {
                    throw new Error('No se encontraron productos en la factura');
                }

                // Obtener los métodos de pago
                const paymentsQuery = `
                    SELECT mp.nombre AS metodo, fmp.monto
                    FROM factura_medio_pago fmp
                    JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                    WHERE fmp.factura_id = ?
                `;
                const paymentResults = await new Promise((resolve, reject) => {
                    connection.query(paymentsQuery, [factura_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Sumar las cantidades al inventario
                for (const product of productsResult) {
                    const updateStockQuery = `UPDATE productos SET cantidad = cantidad + ? WHERE id = ? AND estado = 'activo'`;
                    await new Promise((resolve, reject) => {
                        connection.query(updateStockQuery, [product.cantidad, product.producto_id], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                }

                // Actualizar el estado de la factura a 'anulada'
                const updateInvoiceQuery = `UPDATE factura SET estado = 'anulada' WHERE id = ?`;
                await new Promise((resolve, reject) => {
                    connection.query(updateInvoiceQuery, [factura_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Fetch client details if clientId is provided
                let clientName = 'Cliente';
                if (invoice.cliente_id) {
                    const clientQuery = `SELECT nombre FROM clientes WHERE id = ?`;
                    const clientResult = await new Promise((resolve, reject) => {
                        connection.query(clientQuery, [invoice.cliente_id], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });

                    if (clientResult.length > 0) {
                        clientName = clientResult[0].nombre;
                    }
                }

                // Generate and replace the PDF with "CANCELADA" watermark
                const invoiceDetails = {
                    numeroFactura: invoice.numero,
                    fecha: invoice.fecha,
                    productos: productsResult,
                    descuentos: [], // Ajustar si hay descuentos
                    mediosDePago: paymentResults,
                    montoTotal: invoice.montoTotal
                };
                await generateCanceledInvoicePDF(invoiceDetails, clientName);

                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.end();
                            return res.status(500).json({ error: 'Error al confirmar la cancelación' });
                        });
                    }
                    connection.end();
                    res.status(200).json({ message: 'Factura cancelada exitosamente' });
                });
            } catch (error) {
                connection.rollback(() => {
                    connection.end();
                    console.error('Error al cancelar la factura:', error);
                    res.status(500).json({ error: error.message || 'Error al cancelar la factura' });
                });
            }
        });
    });
});


module.exports = router;