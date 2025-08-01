const ExcelJS = require('exceljs');

function formatDateToReadable(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

module.exports.exportToExcel = async function(data, exportType, period, folder, timestamp) {
    const workbook = new ExcelJS.Workbook();
    const filename = `${folder}/Exportacion_${exportType}_${period}_${timestamp}.xlsx`;

    if (exportType === 'todos') {
        for (const [type, typeData] of Object.entries(data)) {
            const worksheet = workbook.addWorksheet(type);
            populateWorksheet(worksheet, typeData, type);
        }
    } else {
        const worksheet = workbook.addWorksheet(exportType);
        populateWorksheet(worksheet, data, exportType);
    }

    await workbook.xlsx.writeFile(filename);
    return filename;
};

function populateWorksheet(worksheet, data, type) {
    if (type === 'productos') {
        worksheet.columns = [
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Categoría', key: 'categoria', width: 20 },
            { header: 'Precio', key: 'precio', width: 15 },
            { header: 'Cantidad', key: 'cantidad', width: 10 }
        ];
        worksheet.getRow(1).font = { bold: true };
        data.forEach(product => {
            worksheet.addRow({
                codigo: product.codigo || 'N/A',
                nombre: product.nombre || 'N/A',
                categoria: product.categoria || 'N/A',
                precio: product.precio || 0,
                cantidad: product.cantidad || 0
            });
            if (product.cantidad < 5) {
                const row = worksheet.lastRow;
                row.getCell('cantidad').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
            }
        });
    } else if (type === 'facturas') {
        const summarySheet = worksheet.workbook.addWorksheet('Resumen');
        summarySheet.columns = [
            { header: 'Concepto', key: 'concepto', width: 25 },
            { header: 'Valor', key: 'valor', width: 20 }
        ];
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.addRow(['Total Recibido', data.totalRecibido || 0]);
        summarySheet.addRow(['Total Facturas', data.totalFacturas || 0]);
        summarySheet.addRow(['Facturas Canceladas', data.facturasCanceladas || 0]);
        summarySheet.addRow(['Ingresos por Transferencia', data.ingresosTransferencia || 0]);
        summarySheet.addRow(['Ingresos por Efectivo', data.ingresosEfectivo || 0]);

        worksheet.columns = [
            { header: 'Número de Factura', key: 'numero', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 25 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Cantidad', key: 'cantidad', width: 10 }
        ];
        worksheet.getRow(1).font = { bold: true };

        if (data.detalles && Array.isArray(data.detalles)) {
            data.detalles.forEach(factura => {
                factura.productos.forEach(p => {
                    worksheet.addRow({
                        numero: factura.numero || `FAC-${factura.id}`,
                        fecha: formatDateToReadable(factura.fecha),
                        cliente: factura.cliente || 'Cliente no registrado',
                        total: factura.total,
                        producto: p.nombre,
                        cantidad: p.cantidad
                    });
                });
            });
        }
    } else if (['entrada_mercancia', 'salida_mercancia', 'devoluciones'].includes(type)) {
        worksheet.columns = [
            { header: 'Producto', key: 'nombre', width: 30 },
            { header: type === 'entrada_mercancia' ? 'Proveedor' : 'Razón', key: type === 'entrada_mercancia' ? 'proveedor' : 'razon', width: 20 },
            { header: 'Cantidad', key: 'cantidad', width: 10 },
            { header: 'Fecha', key: 'fecha', width: 25 }
        ];
        worksheet.getRow(1).font = { bold: true };
        data.forEach(item => {
            worksheet.addRow({
                nombre: item.nombre || 'N/A',
                [type === 'entrada_mercancia' ? 'proveedor' : 'razon']: item.proveedor || item.razon || 'N/A',
                cantidad: item.cantidad || 0,
                fecha: formatDateToReadable(item.fecha) || 'N/A'
            });
        });
    }
}