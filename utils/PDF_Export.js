const PDFDocument = require('pdfkit');
const fs = require('fs');

function formatDateToReadable(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

module.exports.exportToPDF = async function(data, exportType, period, folder, timestamp) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const filename = `${folder}/Exportacion_${exportType}_${period}_${timestamp}.pdf`;
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        const addHeader = () => {
            // Resetear todos los estilos primero
            doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(10);
            
            // Header con diseño limpio
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#2c3e50')
                .text('Sistema de Gestión', 40, 40);
            
            doc.fontSize(11).font('Helvetica').fillColor('#34495e')
                .text(`Exportación: ${exportType.toUpperCase()} | Período: ${period.toUpperCase()}`, 40, 68)
                .text(`Fecha de generación: ${formatDateToReadable(new Date())}`, 40, 82);
            
            // Línea separadora
            doc.strokeColor('#bdc3c7').lineWidth(1)
                .moveTo(40, 98).lineTo(555, 98).stroke();
        };

        const drawTable = (headers, rows, startY, options = {}) => {
            const { rowHeight = 22, colWidths = [], headerColor = '#34495e', alternateColor = '#f8f9fa' } = options;
            let y = startY;
            const pageHeight = doc.page.height - 60; // Más espacio sin footer
            
            // Función para dibujar headers
            const drawHeaders = (yPos) => {
                // Resetear estilos completamente
                doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(10);
                
                headers.forEach((header, i) => {
                    const x = 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    
                    // Fondo del header
                    doc.fillColor(headerColor)
                        .rect(x, yPos, colWidths[i], rowHeight)
                        .fill();
                    
                    // Texto del header
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
                        .text(header, x + 8, yPos + 6, { 
                            width: colWidths[i] - 16,
                            align: 'left'
                        });
                });
                return yPos + rowHeight;
            };

            // Dibujar headers iniciales
            y = drawHeaders(y);

            // Dibujar filas de datos
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                // Verificar si necesitamos nueva página
                if (y + rowHeight > pageHeight) {
                    doc.addPage();
                    addHeader();
                    y = drawHeaders(115);
                }

                const row = rows[rowIndex];
                const fillColor = rowIndex % 2 === 0 ? '#ffffff' : alternateColor;
                
                // Resetear estilos antes de cada fila
                doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(9);
                
                row.forEach((cell, i) => {
                    const x = 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    
                    // Fondo de celda
                    doc.fillColor(fillColor)
                        .rect(x, y, colWidths[i], rowHeight)
                        .fill();
                    
                    // Borde de celda
                    doc.strokeColor('#e9ecef').lineWidth(0.5)
                        .rect(x, y, colWidths[i], rowHeight)
                        .stroke();
                    
                    // Texto de celda
                    doc.fillColor('#2c3e50').fontSize(9).font('Helvetica')
                        .text(String(cell), x + 8, y + 7, { 
                            width: colWidths[i] - 16,
                            align: 'left'
                        });
                });
                y += rowHeight;
            }
            
            return y;
        };

        const renderData = (doc, data, type) => {
            let y = 115;
            
            // Resetear estilos al inicio
            doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(10);

            if (type === 'productos') {
                if (!data || !Array.isArray(data)) {
                    doc.fontSize(12).fillColor('#e74c3c').font('Helvetica')
                        .text('No hay productos para mostrar', 40, y);
                    return;
                }
                
                // Título de sección
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
                    .text('LISTADO DE PRODUCTOS', 40, y);
                y += 25;
                
                const headers = ['Código', 'Nombre', 'Categoría', 'Precio', 'Cantidad'];
                const colWidths = [80, 150, 100, 80, 80];
                const rows = data.map(product => [
                    product.codigo || 'N/A',
                    product.nombre || 'N/A',
                    product.categoria || 'N/A',
                    `${(product.precio || 0).toLocaleString()}`,
                    product.cantidad < 5 ? `${product.cantidad || 0} (¡Stock bajo!)` : `${product.cantidad || 0}`
                ]);
                
                drawTable(headers, rows, y, { colWidths });
                
            } else if (type === 'facturas') {
                if (!data || typeof data !== 'object') {
                    doc.fontSize(12).fillColor('#e74c3c').font('Helvetica')
                        .text('No hay facturas para mostrar', 40, y);
                    return;
                }
                
                // Título de resumen
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
                    .text('RESUMEN FINANCIERO', 40, y);
                y += 25;
                
                const summaryHeaders = ['Concepto', 'Valor'];
                const summaryRows = [
                    ['Total Recibido', `$${(data.totalRecibido || 0).toLocaleString()}`],
                    ['Total Facturas', `${data.totalFacturas || 0} facturas`],
                    ['Facturas Canceladas', `${data.facturasCanceladas || 0} facturas`],
                    ['Ingresos por Transferencia', `$${(data.ingresosTransferencia || 0).toLocaleString()}`],
                    ['Ingresos por Efectivo', `$${(data.ingresosEfectivo || 0).toLocaleString()}`]
                ];
                
                y = drawTable(summaryHeaders, summaryRows, y, { 
                    colWidths: [220, 295], 
                    rowHeight: 26,
                    headerColor: '#27ae60'
                });

                // Detalles de facturas
                if (data.detalles && Array.isArray(data.detalles)) {
                    y += 35;
                    if (y > doc.page.height - 150) {
                        doc.addPage();
                        addHeader();
                        y = 115;
                    }
                    
                    // Resetear estilos antes del título
                    doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(10);
                    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
                        .text('DETALLE DE FACTURAS', 40, y);
                    y += 25;
                    
                    data.detalles.forEach((factura, index) => {
                        if (y > doc.page.height - 220) {
                            doc.addPage();
                            addHeader();
                            y = 115;
                        }
                        
                        // Resetear estilos para cada factura
                        doc.fillColor('#000000').strokeColor('#000000').font('Helvetica').fontSize(10);
                        doc.fontSize(11).font('Helvetica-Bold').fillColor('#34495e')
                            .text(`Factura #${index + 1}`, 40, y);
                        y += 18;
                        
                        const invoiceHeaders = ['Número', 'Fecha', 'Cliente', 'Total'];
                        const invoiceRow = [
                            factura.numero || `FAC-${factura.id}`,
                            formatDateToReadable(factura.fecha),
                            factura.cliente || 'Cliente no registrado',
                            `$${(factura.total || 0).toLocaleString()}`
                        ];
                        
                        y = drawTable(invoiceHeaders, [invoiceRow], y, { 
                            colWidths: [85, 115, 155, 160],
                            headerColor: '#3498db'
                        });

                        if (factura.productos && Array.isArray(factura.productos)) {
                            y += 15;
                            const productHeaders = ['Producto', 'Cant.', 'Precio Unit.', 'Subtotal'];
                            const productRows = factura.productos.map(p => [
                                p.nombre || 'N/A',
                                p.cantidad || 0,
                                `$${(p.precio_unitario || 0).toLocaleString()}`,
                                `$${(p.subtotal || 0).toLocaleString()}`
                            ]);
                            
                            y = drawTable(productHeaders, productRows, y, { 
                                colWidths: [195, 70, 105, 145],
                                headerColor: '#95a5a6'
                            });
                        }
                        y += 25;
                    });
                }
                
            } else if (['entrada_mercancia', 'salida_mercancia', 'devoluciones'].includes(type)) {
                if (!data || !Array.isArray(data)) {
                    doc.fontSize(12).fillColor('#e74c3c').font('Helvetica')
                        .text(`No hay datos de ${type.replace('_', ' ')} para mostrar`, 40, y);
                    return;
                }
                
                const titles = {
                    'entrada_mercancia': 'ENTRADA DE MERCANCÍA',
                    'salida_mercancia': 'SALIDA DE MERCANCÍA', 
                    'devoluciones': 'DEVOLUCIONES'
                };
                
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
                    .text(titles[type], 40, y);
                y += 25;
                
                const headers = ['Producto', type === 'entrada_mercancia' ? 'Proveedor' : 'Razón', 'Cantidad', 'Fecha'];
                const colWidths = [160, 155, 85, 115];
                const rows = data.map(item => [
                    item.nombre || 'N/A',
                    item.proveedor || item.razon || 'N/A',
                    item.cantidad || 0,
                    formatDateToReadable(item.fecha) || 'N/A'
                ]);
                
                const headerColors = {
                    'entrada_mercancia': '#27ae60',
                    'salida_mercancia': '#e67e22',
                    'devoluciones': '#e74c3c'
                };
                
                drawTable(headers, rows, y, { 
                    colWidths,
                    headerColor: headerColors[type] || '#34495e'
                });
            }
        };

        // Renderizado principal
        if (exportType === 'todos') {
            let isFirstSection = true;
            for (const [type, typeData] of Object.entries(data)) {
                if (!isFirstSection) {
                    doc.addPage();
                }
                isFirstSection = false;
                addHeader();
                renderData(doc, typeData, type);
            }
        } else {
            addHeader();
            renderData(doc, data, exportType);
        }

        doc.end();
        stream.on('finish', () => resolve(filename));
        stream.on('error', (err) => reject(new Error(`Error al escribir el archivo PDF: ${err.message}`)));
    });
};