const PDFDocument = require('pdfkit');
const fs = require('fs'); // Import standard fs for createWriteStream
const fsPromises = require('fs').promises; // Import fs.promises for async operations
const path = require('path');

// Function to generate and save invoice PDF
async function generateInvoicePDF(invoiceDetails, clientName) {
  try {
    // Extract invoice details
    const { numeroFactura, fecha, productos, descuentos, mediosDePago, montoTotal } = invoiceDetails;
    const invoiceDate = new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Define directory structure
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.toLocaleString('es-CO', { month: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const baseDir = path.join(__dirname, '..', 'Facturas', `Año ${year}`, `Mes ${month}`, `Dia ${day}`);
    const fileName = `${numeroFactura}.pdf`;
    const filePath = path.join(baseDir, fileName);

    // Create directories if they don't exist
    await fsPromises.mkdir(baseDir, { recursive: true });

    // Initialize PDF document (80mm width = ~226 points at 72 DPI)
    const doc = new PDFDocument({
      size: [226, 1000], // Initial height, will be adjusted
      margin: 10
    });

    // Pipe to file
    const stream = doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    doc.fontSize(10).text('Tienda', { align: 'center' });
    doc.text('Factura Electrónica', { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`No. ${numeroFactura}`, { align: 'center' });
    doc.text(`Fecha: ${invoiceDate}`, { align: 'center' });
    doc.text(`Cliente: ${clientName}`, { align: 'center' });
    doc.moveDown(0.5);

    // Draw line
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.5);

    // Products table header
    doc.fontSize(8);
    doc.text('Cant.', 10, doc.y, { width: 30 });
    doc.text('Producto', 40, doc.y, { width: 100 });
    doc.text('Total', 140, doc.y, { width: 76, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.3);

    // Products
    productos.forEach(product => {
      const subtotal = product.cantidad * product.precioUnitario;
      doc.text(product.cantidad.toString(), 10, doc.y, { width: 30 });
      doc.text(product.nombre, 40, doc.y, { width: 100 });
      doc.text(
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal).replace('COP', '').trim(),
        140, doc.y, { width: 76, align: 'right' }
      );
      doc.moveDown(0.3);
    });

    // Discounts
    descuentos.forEach(discount => {
      doc.text('1', 10, doc.y, { width: 30 });
      doc.text('DESCUENTO', 40, doc.y, { width: 100 });
      doc.text(
        `-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(discount.monto).replace('COP', '').trim()}`,
        140, doc.y, { width: 76, align: 'right' }
      );
      doc.moveDown(0.3);
    });

    // Draw line
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.3);

    // Total
    doc.fontSize(9);
    doc.text('Total:', 10, doc.y, { width: 130 });
    doc.text(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(montoTotal).replace('COP', '').trim(),
      140, doc.y, { width: 76, align: 'right' }
    );
    doc.moveDown(0.5);

    // Payment methods
    doc.fontSize(8);
    doc.text('Métodos de Pago:', 10, doc.y);
    doc.moveDown(0.3);
    mediosDePago.forEach(payment => {
      doc.text(
        `${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.monto).replace('COP', '').trim()}`,
        10, doc.y
      );
      doc.moveDown(0.3);
    });

    // Footer
    doc.moveDown(0.5);
    doc.text('Gracias por su compra!', { align: 'center' });
    doc.text('Tienda', { align: 'center' });

    // Finalize PDF
    doc.end();
    await new Promise((resolve) => stream.on('finish', resolve));

    console.log(`PDF generated and saved at ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}

// Function to generate and save canceled invoice PDF
async function generateCanceledInvoicePDF(invoiceDetails, clientName) {
  try {
    // Extract invoice details
    const { numeroFactura, fecha, productos, descuentos, mediosDePago, montoTotal } = invoiceDetails;
    const invoiceDate = new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Define directory structure
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.toLocaleString('es-CO', { month: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const baseDir = path.join(__dirname, '..', 'Facturas', `Año ${year}`, `Mes ${month}`, `Dia ${day}`);
    const fileName = `${numeroFactura}.pdf`;
    const filePath = path.join(baseDir, fileName);

    // Create directories if they don't exist
    await fsPromises.mkdir(baseDir, { recursive: true });

    // Initialize PDF document (80mm width = ~226 points at 72 DPI)
    const doc = new PDFDocument({
      size: [226, 1000], // Initial height, will be adjusted
      margin: 10
    });

    // Pipe to file
    const stream = doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    doc.fontSize(10).text('Tienda', { align: 'center' });
    doc.text('Factura Electrónica', { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`No. ${numeroFactura}`, { align: 'center' });
    doc.text(`Fecha: ${invoiceDate}`, { align: 'center' });
    doc.text(`Cliente: ${clientName}`, { align: 'center' });
    doc.moveDown(0.5);

    // Draw line
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.5);

    // Products table header
    doc.fontSize(8);
    doc.text('Cant.', 10, doc.y, { width: 30 });
    doc.text('Producto', 40, doc.y, { width: 100 });
    doc.text('Total', 140, doc.y, { width: 76, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.3);

    // Products
    productos.forEach(product => {
      const subtotal = product.cantidad * product.precioUnitario;
      doc.text(product.cantidad.toString(), 10, doc.y, { width: 30 });
      doc.text(product.nombre, 40, doc.y, { width: 100 });
      doc.text(
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal).replace('COP', '').trim(),
        140, doc.y, { width: 76, align: 'right' }
      );
      doc.moveDown(0.3);
    });

    // Discounts
    descuentos.forEach(discount => {
      doc.text('1', 10, doc.y, { width: 30 });
      doc.text('DESCUENTO', 40, doc.y, { width: 100 });
      doc.text(
        `-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(discount.monto).replace('COP', '').trim()}`,
        140, doc.y, { width: 76, align: 'right' }
      );
      doc.moveDown(0.3);
    });

    // Draw line
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
    doc.moveDown(0.3);

    // Total
    doc.fontSize(9);
    doc.text('Total:', 10, doc.y, { width: 130 });
    doc.text(
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(montoTotal).replace('COP', '').trim(),
      140, doc.y, { width: 76, align: 'right' }
    );
    doc.moveDown(0.5);

    // Payment methods
    doc.fontSize(8);
    doc.text('Métodos de Pago:', 10, doc.y);
    doc.moveDown(0.3);
    mediosDePago.forEach(payment => {
      doc.text(
        `${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.monto).replace('COP', '').trim()}`,
        10, doc.y
      );
      doc.moveDown(0.3);
    });

    // Footer
    doc.moveDown(0.5);
    doc.text('Gracias por su compra!', { align: 'center' });
    doc.text('Tienda', { align: 'center' });

    // Add "CANCELADA" watermark - IMPROVED VERSION
    doc.save();
    
    // Calculate center position of the document
    const pageWidth = 226;
    const pageHeight = doc.y + 50; // Current position plus some margin
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Move to center and rotate
    doc.translate(centerX, centerY);
    doc.rotate(45);
    
    // Configure watermark text
    doc.fontSize(24)
       .fillColor('red')
       .opacity(0.3);
    
    // Draw the watermark centered at origin (which is now the center of the page)
    doc.text('CANCELADA', -60, -10, { 
      width: 120, 
      align: 'center',
      lineBreak: false
    });
    
    doc.restore();

    // Finalize PDF
    doc.end();
    await new Promise((resolve) => stream.on('finish', resolve));

    console.log(`Canceled PDF generated and replaced at ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error generating canceled PDF:', error);
    throw new Error('Failed to generate canceled invoice PDF');
  }
}

module.exports = { generateInvoicePDF,generateCanceledInvoicePDF };