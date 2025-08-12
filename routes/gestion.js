const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { exportToPDF } = require('../utils/PDF_Export');
const { exportToExcel } = require('../utils/Excel_Export');

dotenv.config();

// Función helper para crear conexión
function createConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}

// Función helper para formatear fecha en YYYY-MM-DD
const formatDateToSQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Función helper para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Función helper para obtener la carpeta de descargas del usuario
function getDownloadsFolder() {
    return path.join(os.homedir(), 'Downloads');
}

// Ruta para obtener estadísticas rápidas
router.get('/estadisticas-rapidas', (req, res) => {
    const connection = createConnection();

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const today = new Date();
        const todayStr = formatDateToSQL(today);
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const currentYear = today.getFullYear();

        const queries = {
            dailyIncome: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE(fecha) = ? AND estado IN ('activa', 'pendiente')
            `,
            monthlyIncome: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE_FORMAT(fecha, '%Y-%m') = ? AND estado = 'activa'
            `,
            yearlyIncome: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE YEAR(fecha) = ? AND estado = 'activa'
            `,
            bestSeller: `
                SELECT p.nombre, SUM(df.cantidad) as total_vendido
                FROM detalle_factura df
                INNER JOIN productos p ON df.producto_id = p.id
                INNER JOIN factura f ON df.factura_id = f.id
                WHERE f.estado = 'activa'
                GROUP BY df.producto_id, p.nombre
                ORDER BY total_vendido DESC
                LIMIT 1
            `,
            invoicesIssued: `
                SELECT COUNT(*) as total 
                FROM factura
            `,
            invoicesCanceled: `
                SELECT COUNT(*) as total 
                FROM factura 
                WHERE estado = 'anulada'
            `,
            topPaymentMethod: `
                SELECT mp.nombre, COUNT(fmp.id) as uso_total
                FROM factura_medio_pago fmp
                INNER JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                INNER JOIN factura f ON fmp.factura_id = f.id
                WHERE f.estado = 'activa'
                GROUP BY fmp.medio_pago_id, mp.nombre
                ORDER BY uso_total DESC
                LIMIT 1
            `
        };

        let completedQueries = 0;
        let results = {};

        connection.query(queries.dailyIncome, [todayStr], (err, dailyResult) => {
            if (err) console.error('Error daily income:', err);
            results.dailyIncome = dailyResult ? dailyResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.monthlyIncome, [currentMonth], (err, monthlyResult) => {
            if (err) console.error('Error monthly income:', err);
            results.monthlyIncome = monthlyResult ? monthlyResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.yearlyIncome, [currentYear], (err, yearlyResult) => {
            if (err) console.error('Error yearly income:', err);
            results.yearlyIncome = yearlyResult ? yearlyResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.bestSeller, (err, bestSellerResult) => {
            if (err) console.error('Error best seller:', err);
            results.bestSeller = bestSellerResult && bestSellerResult.length > 0 ? bestSellerResult[0].nombre : 'Sin datos';
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.invoicesIssued, (err, issuedResult) => {
            if (err) console.error('Error invoices issued:', err);
            results.invoicesIssued = issuedResult ? issuedResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.invoicesCanceled, (err, canceledResult) => {
            if (err) console.error('Error invoices canceled:', err);
            results.invoicesCanceled = canceledResult ? canceledResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.topPaymentMethod, (err, paymentResult) => {
            if (err) console.error('Error top payment method:', err);
            results.topPaymentMethod = paymentResult && paymentResult.length > 0 ? paymentResult[0].nombre.charAt(0).toUpperCase() + paymentResult[0].nombre.slice(1) : 'Sin datos';
            completedQueries++;
            checkCompletion();
        });

        function checkCompletion() {
            if (completedQueries === 7) {
                connection.end();
                const formattedResults = {
                    dailyIncome: formatCurrency(results.dailyIncome),
                    monthlyIncome: formatCurrency(results.monthlyIncome),
                    yearlyIncome: formatCurrency(results.yearlyIncome),
                    bestSeller: results.bestSeller,
                    invoicesIssued: `${results.invoicesIssued} facturas`,
                    invoicesCanceled: `${results.invoicesCanceled} facturas`,
                    topPaymentMethod: results.topPaymentMethod
                };
                res.status(200).json(formattedResults);
            }
        }
    });
});

// Ruta para obtener alertas de negocio (productos con menos de 5 unidades)
router.get('/alertas-negocio', (req, res) => {
    const connection = createConnection();
    
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const query = `
            SELECT nombre, cantidad 
            FROM productos 
            WHERE cantidad < 5 AND estado = 'activo'
            ORDER BY cantidad ASC
        `;

        connection.query(query, (err, results) => {
            connection.end();
            
            if (err) {
                console.error('Error fetching alerts:', err);
                return res.status(500).json({ error: 'Error al obtener alertas' });
            }

            const alerts = results.map(product => ({
                message: `⚠️ Producto con menos de 5 unidades: ${product.nombre} (${product.cantidad} unidades)`,
                product: product.nombre,
                quantity: product.cantidad
            }));

            res.status(200).json(alerts);
        });
    });
});

// Ruta para obtener tendencias de ventas (Hoy vs Ayer, Mes Actual vs Mes Anterior)
router.get('/tendencias-ventas', (req, res) => {
    const connection = createConnection();

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const todayStr = formatDateToSQL(today);
        const yesterdayStr = formatDateToSQL(yesterday);
        const currentMonthStartStr = formatDateToSQL(currentMonthStart);
        const previousMonthStartStr = formatDateToSQL(previousMonthStart);
        const previousMonthEndStr = formatDateToSQL(previousMonthEnd);

        const queries = {
            todaySales: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE(fecha) = ? AND estado IN ('activa', 'pendiente')
            `,
            yesterdaySales: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE(fecha) = ? AND estado = 'activa'
            `,
            currentMonthSales: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE(fecha) >= ? AND DATE(fecha) <= ? AND estado = 'activa'
            `,
            previousMonthSales: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM factura 
                WHERE DATE(fecha) >= ? AND DATE(fecha) <= ? AND estado = 'activa'
            `
        };

        let completedQueries = 0;
        let results = {};

        connection.query(queries.todaySales, [todayStr], (err, todayResult) => {
            if (err) console.error('Error today sales:', err);
            results.todaySales = todayResult ? todayResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.yesterdaySales, [yesterdayStr], (err, yesterdayResult) => {
            if (err) console.error('Error yesterday sales:', err);
            results.yesterdaySales = yesterdayResult ? yesterdayResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.currentMonthSales, [currentMonthStartStr, todayStr], (err, currentMonthResult) => {
            if (err) console.error('Error current month sales:', err);
            results.currentMonthSales = currentMonthResult ? currentMonthResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.previousMonthSales, [previousMonthStartStr, previousMonthEndStr], (err, previousMonthResult) => {
            if (err) console.error('Error previous month sales:', err);
            results.previousMonthSales = previousMonthResult ? previousMonthResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        function checkCompletion() {
            if (completedQueries === 4) {
                connection.end();
                res.status(200).json({
                    todayVsYesterday: {
                        today: parseFloat(results.todaySales),
                        yesterday: parseFloat(results.yesterdaySales)
                    },
                    currentVsPreviousMonth: {
                        currentMonth: parseFloat(results.currentMonthSales),
                        previousMonth: parseFloat(results.previousMonthSales)
                    }
                });
            }
        }
    });
});

// Ruta para obtener datos detallados por día
router.get('/datos-dia', (req, res) => {
    const connection = createConnection();
    const { date } = req.query;

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.status(500).json({ error: 'Error de conexión a la base de datos' });
        }

        const queries = {
            totalInvoices: `
                SELECT COUNT(*) as total 
                FROM factura 
                WHERE DATE(fecha) = ? AND estado IN ('activa', 'parcialmente_devuelta')
            `,
            rejectedInvoices: `
                SELECT COUNT(*) as total 
                FROM factura 
                WHERE DATE(fecha) = ? AND estado = 'anulada'
            `,
            totalProductsSold: `
                SELECT SUM(df.cantidad) as total 
                FROM detalle_factura df
                INNER JOIN factura f ON df.factura_id = f.id
                WHERE DATE(f.fecha) = ? AND f.estado = 'activa'
            `,
            topSoldProduct: `
                SELECT p.nombre, SUM(df.cantidad) as total_vendido
                FROM detalle_factura df
                INNER JOIN productos p ON df.producto_id = p.id
                INNER JOIN factura f ON df.factura_id = f.id
                WHERE DATE(f.fecha) = ? AND f.estado = 'activa'
                GROUP BY df.producto_id, p.nombre
                ORDER BY total_vendido DESC
                LIMIT 1
            `,
            incomeTransfer: `
                SELECT COALESCE(SUM(fmp.monto), 0) as total 
                FROM factura_medio_pago fmp
                INNER JOIN factura f ON fmp.factura_id = f.id
                INNER JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                WHERE DATE(f.fecha) = ? AND mp.nombre = 'transferencia' AND f.estado = 'activa'
            `,
            incomeCash: `
                SELECT COALESCE(SUM(fmp.monto), 0) as total 
                FROM factura_medio_pago fmp
                INNER JOIN factura f ON fmp.factura_id = f.id
                INNER JOIN medios_pago mp ON fmp.medio_pago_id = mp.id
                WHERE DATE(f.fecha) = ? AND mp.nombre = 'efectivo' AND f.estado = 'activa'
            `
        };

        let completedQueries = 0;
        let results = {};

        connection.query(queries.totalInvoices, [date], (err, totalResult) => {
            if (err) console.error('Error total invoices:', err);
            results.totalInvoices = totalResult ? totalResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.rejectedInvoices, [date], (err, rejectedResult) => {
            if (err) console.error('Error rejected invoices:', err);
            results.rejectedInvoices = rejectedResult ? rejectedResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.totalProductsSold, [date], (err, productsResult) => {
            if (err) console.error('Error total products sold:', err);
            results.totalProductsSold = productsResult ? productsResult[0].total || 0 : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.topSoldProduct, [date], (err, topProductResult) => {
            if (err) console.error('Error top sold product:', err);
            results.topSoldProduct = topProductResult && topProductResult.length > 0 ? topProductResult[0].nombre : 'Sin datos';
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.incomeTransfer, [date], (err, transferResult) => {
            if (err) console.error('Error income transfer:', err);
            results.incomeTransfer = transferResult ? transferResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        connection.query(queries.incomeCash, [date], (err, cashResult) => {
            if (err) console.error('Error income cash:', err);
            results.incomeCash = cashResult ? cashResult[0].total : 0;
            completedQueries++;
            checkCompletion();
        });

        function checkCompletion() {
            if (completedQueries === 6) {
                connection.end();
                res.status(200).json(results);
            }
        }
    });
});

// Exportar datos - Rutas de exportación de datos
router.get('/exportar-productos', (req, res) => {
    const { period } = req.query;
    const connection = createConnection();
    connection.query(
        `SELECT p.codigo, p.nombre, c.nombre as categoria, p.precio, p.cantidad 
         FROM productos p 
         JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.estado = 'activo'`,
        (err, results) => {
            connection.end();
            if (err) {
                console.error('Error en /exportar-productos:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json(results || []);
        }
    );
});

router.get('/exportar-facturas', (req, res) => {
    const { period } = req.query;
    const connection = createConnection();
    const today = formatDateToSQL(new Date());
    let dateValue, dateCondition, subqueryDateCondition;

    // Definir condiciones según el período seleccionado
    if (period) {
        switch (period) {
            case 'dia': 
                dateValue = today;
                dateCondition = 'DATE(f.fecha) = ?';
                subqueryDateCondition = 'DATE(fecha) = ?';
                break;
            case 'mes': 
                dateValue = today.slice(0, 7);
                dateCondition = 'DATE_FORMAT(f.fecha, "%Y-%m") = ?';
                subqueryDateCondition = 'DATE_FORMAT(fecha, "%Y-%m") = ?';
                break;
            case 'ano': 
                dateValue = today.slice(0, 4);
                dateCondition = 'YEAR(f.fecha) = ?';
                subqueryDateCondition = 'YEAR(fecha) = ?';
                break;
            default:
                dateValue = today;
                dateCondition = 'DATE(f.fecha) = ?';
                subqueryDateCondition = 'DATE(fecha) = ?';
        }
    } else {
        dateCondition = '1=1'; // No period filter, fetch all records
        subqueryDateCondition = '1=1';
        dateValue = null;
    }

    // Consulta principal para obtener el resumen de facturas
    const summaryQuery = `
        SELECT 
            COALESCE(SUM(f.total), 0) as totalRecibido,
            COUNT(f.id) as totalFacturas,
            (SELECT COUNT(*) 
             FROM factura 
             WHERE estado = 'anulada' 
             ${period ? `AND ${subqueryDateCondition}` : ''}) as facturasCanceladas,
            (SELECT COALESCE(SUM(fmp.monto), 0)
             FROM factura_medio_pago fmp 
             JOIN medios_pago mp ON fmp.medio_pago_id = mp.id 
             JOIN factura f ON fmp.factura_id = f.id
             WHERE mp.nombre = 'transferencia' 
             AND f.estado IN ('activa', 'parcialmente_devuelta')
             ${period ? `AND ${subqueryDateCondition}` : ''}) as ingresosTransferencia,
            (SELECT COALESCE(SUM(fmp.monto), 0)
             FROM factura_medio_pago fmp 
             JOIN medios_pago mp ON fmp.medio_pago_id = mp.id 
             JOIN factura f ON fmp.factura_id = f.id
             WHERE mp.nombre = 'efectivo' 
             AND f.estado IN ('activa', 'parcialmente_devuelta')
             ${period ? `AND ${subqueryDateCondition}` : ''}) as ingresosEfectivo
        FROM factura f 
        WHERE ${dateCondition} 
        AND f.estado IN ('activa', 'parcialmente_devuelta')
    `;

    connection.query(summaryQuery, dateValue ? [dateValue, dateValue, dateValue, dateValue] : [], (err, summary) => {
        if (err) {
            console.error('Error en /exportar-facturas (summary):', err);
            connection.end();
            return res.status(500).json({ error: err.message });
        }

        // Consulta para obtener las facturas individuales (para los detalles)
        const detailsQuery = `
            SELECT f.id, f.numero, f.fecha, f.total, c.nombre as cliente_nombre
            FROM factura f
            LEFT JOIN clientes c ON f.cliente_id = c.id
            WHERE ${dateCondition} 
            AND f.estado IN ('activa', 'parcialmente_devuelta')
            ORDER BY f.fecha DESC
        `;

        connection.query(detailsQuery, dateValue ? [dateValue] : [], (err, facturas) => {
            if (err) {
                console.error('Error en /exportar-facturas (details):', err);
                connection.end();
                return res.status(500).json({ error: err.message });
            }

            if (!facturas || facturas.length === 0) {
                connection.end();
                return res.status(200).json({
                    totalRecibido: formatCurrency(0),
                    totalFacturas: 0,
                    facturasCanceladas: 0,
                    ingresosTransferencia: formatCurrency(0),
                    ingresosEfectivo: formatCurrency(0),
                    detalles: []
                });
            }

            // Obtener detalles de productos para cada factura
            const detailsPromises = facturas.map(factura => 
                new Promise((resolve, reject) => {
                    connection.query(
                        `SELECT p.nombre, df.cantidad, df.precio_unitario, df.subtotal
                         FROM detalle_factura df 
                         JOIN productos p ON df.producto_id = p.id 
                         WHERE df.factura_id = ?`,
                        [factura.id],
                        (err, productos) => {
                            if (err) reject(err);
                            else resolve({
                                ...factura,
                                productos: productos || []
                            });
                        }
                    );
                })
            );

            Promise.all(detailsPromises)
                .then(detallesFacturas => {
                    connection.end();

                    res.status(200).json({
                        totalRecibido: formatCurrency(summary[0]?.totalRecibido || 0),
                        totalFacturas: facturas.length,
                        facturasCanceladas: summary[0]?.facturasCanceladas || 0,
                        ingresosTransferencia: formatCurrency(summary[0]?.ingresosTransferencia || 0),
                        ingresosEfectivo: formatCurrency(summary[0]?.ingresosEfectivo || 0),
                        detalles: detallesFacturas.map(factura => ({
                            id: factura.id,
                            numero: factura.numero || `FAC-${factura.id}`,
                            fecha: factura.fecha,
                            total: formatCurrency(factura.total),
                            cliente: factura.cliente_nombre || 'Cliente no registrado',
                            productos: factura.productos.map(p => ({
                                nombre: p.nombre,
                                cantidad: p.cantidad,
                                precio_unitario: formatCurrency(p.precio_unitario),
                                subtotal: formatCurrency(p.subtotal)
                            }))
                        }))
                    });
                })
                .catch(err => {
                    console.error('Error en /exportar-facturas (promise):', err);
                    connection.end();
                    res.status(500).json({ error: err.message });
                });
        });
    });
});

router.get('/exportar-entrada-mercancia', (req, res) => {
    const { period } = req.query;
    const connection = createConnection();
    let dateCondition = '';
    const today = formatDateToSQL(new Date());
    
    switch (period) {
        case 'dia': 
            dateCondition = `WHERE DATE(im.fecha) = ?`; 
            break;
        case 'mes': 
            dateCondition = `WHERE DATE_FORMAT(im.fecha, '%Y-%m') = ?`; 
            break;
        case 'ano': 
            dateCondition = `WHERE YEAR(im.fecha) = ?`; 
            break;
        default:
            dateCondition = '';
    }

    connection.query(
        `SELECT p.nombre, COALESCE(pr.nombre, 'N/A') as proveedor, im.unidades_nuevas as cantidad, im.fecha 
         FROM ingresos_mercancia im 
         JOIN productos p ON im.producto_id = p.id 
         LEFT JOIN proveedores pr ON im.proveedor_id = pr.id 
         ${dateCondition}`,
        [period === 'dia' || period === 'mes' || period === 'ano' ? today.slice(0, period === 'ano' ? 4 : period === 'mes' ? 7 : 10) : null],
        (err, results) => {
            connection.end();
            if (err) {
                console.error('Error en /exportar-entrada-mercancia:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json(results || []);
        }
    );
});

router.get('/exportar-salida-mercancia', (req, res) => {
    const { period } = req.query;
    const connection = createConnection();
    let dateCondition = '';
    const today = formatDateToSQL(new Date());
    
    switch (period) {
        case 'dia': 
            dateCondition = `WHERE DATE(sm.fecha) = ?`; 
            break;
        case 'mes': 
            dateCondition = `WHERE DATE_FORMAT(sm.fecha, '%Y-%m') = ?`; 
            break;
        case 'ano': 
            dateCondition = `WHERE YEAR(sm.fecha) = ?`; 
            break;
        default:
            dateCondition = '';
    }

    connection.query(
        `SELECT p.nombre, COALESCE(sm.razon_descuento, 'N/A') as razon, sm.unidades_descontadas as cantidad, sm.fecha 
         FROM salidas_mercancia sm 
         JOIN productos p ON sm.producto_id = p.id 
         ${dateCondition}`,
        [period === 'dia' || period === 'mes' || period === 'ano' ? today.slice(0, period === 'ano' ? 4 : period === 'mes' ? 7 : 10) : null],
        (err, results) => {
            connection.end();
            if (err) {
                console.error('Error en /exportar-salida-mercancia:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json(results || []);
        }
    );
});

router.get('/exportar-devoluciones', (req, res) => {
    const { period } = req.query;
    const connection = createConnection();
    let dateCondition = '';
    const today = formatDateToSQL(new Date());
    
    switch (period) {
        case 'dia': 
            dateCondition = `WHERE DATE(d.fecha) = ?`; 
            break;
        case 'mes': 
            dateCondition = `WHERE DATE_FORMAT(d.fecha, '%Y-%m') = ?`; 
            break;
        case 'ano': 
            dateCondition = `WHERE YEAR(d.fecha) = ?`; 
            break;
        default:
            dateCondition = '';
    }

    connection.query(
        `SELECT p.nombre, COALESCE(d.razon, 'N/A') as razon, d.cantidad, d.fecha 
         FROM devoluciones d 
         JOIN productos p ON d.producto_id = p.id 
         ${dateCondition}`,
        [period === 'dia' || period === 'mes' || period === 'ano' ? today.slice(0, period === 'ano' ? 4 : period === 'mes' ? 7 : 10) : null],
        (err, results) => {
            connection.end();
            if (err) {
                console.error('Error en /exportar-devoluciones:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json(results || []);
        }
    );
});

router.get('/exportar-todos', async (req, res) => {
    const connection = createConnection();
    
    try {
        // Productos
        const productosQuery = `
            SELECT p.codigo, p.nombre, c.nombre as categoria, p.precio, p.cantidad 
            FROM productos p 
            JOIN categorias c ON p.categoria_id = c.id 
            WHERE p.estado = 'activo'
        `;
        
        // Facturas (resumen y detalles)
        const facturasSummaryQuery = `
            SELECT 
                COALESCE(SUM(f.total), 0) as totalRecibido,
                COUNT(f.id) as totalFacturas,
                (SELECT COUNT(*) FROM factura WHERE estado = 'anulada') as facturasCanceladas,
                (SELECT COALESCE(SUM(fmp.monto), 0)
                 FROM factura_medio_pago fmp 
                 JOIN medios_pago mp ON fmp.medio_pago_id = mp.id 
                 JOIN factura f ON fmp.factura_id = f.id
                 WHERE mp.nombre = 'transferencia' 
                 AND f.estado IN ('activa', 'parcialmente_devuelta')) as ingresosTransferencia,
                (SELECT COALESCE(SUM(fmp.monto), 0)
                 FROM factura_medio_pago fmp 
                 JOIN medios_pago mp ON fmp.medio_pago_id = mp.id 
                 JOIN factura f ON fmp.factura_id = f.id
                 WHERE mp.nombre = 'efectivo' 
                 AND f.estado IN ('activa', 'parcialmente_devuelta')) as ingresosEfectivo
            FROM factura f 
            WHERE f.estado IN ('activa', 'parcialmente_devuelta')
        `;
        
        const facturasDetailsQuery = `
            SELECT f.id, f.numero, f.fecha, f.total, c.nombre as cliente_nombre
            FROM factura f
            LEFT JOIN clientes c ON f.cliente_id = c.id
            WHERE f.estado IN ('activa', 'parcialmente_devuelta')
            ORDER BY f.fecha DESC
        `;
        
        // Entrada de mercancía
        const entradaQuery = `
            SELECT p.nombre, COALESCE(pr.nombre, 'N/A') as proveedor, im.unidades_nuevas as cantidad, im.fecha 
            FROM ingresos_mercancia im 
            JOIN productos p ON im.producto_id = p.id 
            LEFT JOIN proveedores pr ON im.proveedor_id = pr.id
        `;
        
        // Salida de mercancía
        const salidaQuery = `
            SELECT p.nombre, COALESCE(sm.razon_descuento, 'N/A') as razon, sm.unidades_descontadas as cantidad, sm.fecha 
            FROM salidas_mercancia sm 
            JOIN productos p ON sm.producto_id = p.id
        `;
        
        // Devoluciones
        const devolucionesQuery = `
            SELECT p.nombre, COALESCE(d.razon, 'N/A') as razon, d.cantidad, d.fecha 
            FROM devoluciones d 
            JOIN productos p ON d.producto_id = p.id
        `;
        
        // Ejecutar todas las consultas
        const [productosResults, facturasSummaryResults, facturasDetailsResults, entradaResults, salidaResults, devolucionesResults] = await Promise.all([
            new Promise((resolve, reject) => {
                connection.query(productosQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            }),
            new Promise((resolve, reject) => {
                connection.query(facturasSummaryQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0] || {});
                });
            }),
            new Promise((resolve, reject) => {
                connection.query(facturasDetailsQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            }),
            new Promise((resolve, reject) => {
                connection.query(entradaQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            }),
            new Promise((resolve, reject) => {
                connection.query(salidaQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            }),
            new Promise((resolve, reject) => {
                connection.query(devolucionesQuery, (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            })
        ]);

        // Obtener detalles de productos para cada factura
        const detailsPromises = facturasDetailsResults.map(factura => 
            new Promise((resolve, reject) => {
                connection.query(
                    `SELECT p.nombre, df.cantidad, df.precio_unitario, df.subtotal
                     FROM detalle_factura df 
                     JOIN productos p ON df.producto_id = p.id 
                     WHERE df.factura_id = ?`,
                    [factura.id],
                    (err, productos) => {
                        if (err) reject(err);
                        else resolve({
                            ...factura,
                            productos: productos || []
                        });
                    }
                );
            })
        );

        const detallesFacturas = await Promise.all(detailsPromises);

        // Formatear el resultado de facturas
        const facturas = {
            totalRecibido: formatCurrency(facturasSummaryResults.totalRecibido || 0),
            totalFacturas: detallesFacturas.length,
            facturasCanceladas: facturasSummaryResults.facturasCanceladas || 0,
            ingresosTransferencia: formatCurrency(facturasSummaryResults.ingresosTransferencia || 0),
            ingresosEfectivo: formatCurrency(facturasSummaryResults.ingresosEfectivo || 0),
            detalles: detallesFacturas.map(factura => ({
                id: factura.id,
                numero: factura.numero || `FAC-${factura.id}`,
                fecha: factura.fecha,
                total: formatCurrency(factura.total),
                cliente: factura.cliente_nombre || 'Cliente no registrado',
                productos: factura.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio_unitario: formatCurrency(p.precio_unitario),
                    subtotal: formatCurrency(p.subtotal)
                }))
            }))
        };

        // Combinar todos los datos
        const data = {
            productos: productosResults,
            facturas,
            entrada_mercancia: entradaResults,
            salida_mercancia: salidaResults,
            devoluciones: devolucionesResults
        };

        connection.end();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Error en /exportar-todos:', error);
        connection.end();
        res.status(500).json({ error: `Error al obtener todos los datos: ${error.message}` });
    }
});

// Nueva ruta para generar el archivo
router.post('/exportar', async (req, res) => {
    const { data, exportType, period, format } = req.body;

    try {
        const downloadsFolder = getDownloadsFolder();
        const exportFolder = path.join(downloadsFolder, 'Exportaciones');
        
        if (!fs.existsSync(exportFolder)) {
            fs.mkdirSync(exportFolder, { recursive: true });
            console.log(`Directorio creado: ${exportFolder}`);
        }

        if (!data) {
            throw new Error('No se recibieron datos para exportar');
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const periodLabel = period === 'todos' ? 'general' : period;

        if (format === 'pdf') {
            const filename = await exportToPDF(data, exportType, periodLabel, exportFolder, timestamp);
            res.status(200).json({ message: `Archivo guardado como ${filename}` });
        } else {
            const filename = await exportToExcel(data, exportType, periodLabel, exportFolder, timestamp);
            res.status(200).json({ message: `Archivo guardado como ${filename}` });
        }
    } catch (error) {
        console.error('Error en /exportar:', error);
        res.status(500).json({ error: `Fallo al exportar: ${error.message}` });
    }
});

module.exports = router;