const nodemailer = require('nodemailer');

// Configure the email transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send invoice email
async function sendInvoiceEmail(clientEmail, clientName, invoiceDetails) {
  try {
    // Format the date
    const invoiceDate = new Date(invoiceDetails.fecha).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Format products table
    const productsHtml = invoiceDetails.productos.map(product => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${product.codigo}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${product.nombre}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.cantidad}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.precioUnitario)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.subtotal)}</td>
      </tr>
    `).join('');

    // Format discounts
    const discountsHtml = invoiceDetails.descuentos.length > 0
      ? invoiceDetails.descuentos.map(discount => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">-</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${discount.nombre}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">1</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(discount.monto)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(discount.monto)}</td>
          </tr>
        `).join('')
      : '';

    // Format payment methods
    const paymentsHtml = invoiceDetails.mediosDePago.map(payment => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.monto)}</td>
      </tr>
    `).join('');

    // Email HTML content
    const mailOptions = {
      from: `"Empresa" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: `Factura Electrónica #${invoiceDetails.numeroFactura}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Factura Electrónica</h2>
          <p>Hola, querido ${clientName},</p>
          <p>Te enviamos tu factura electrónica con los detalles de tu compra:</p>
          
          <h3>Datos de la Factura</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px;"><strong>Número de Factura:</strong></td><td style="padding: 8px;">${invoiceDetails.numeroFactura}</td></tr>
            <tr><td style="padding: 8px;"><strong>Fecha:</strong></td><td style="padding: 8px;">${invoiceDate}</td></tr>
            <tr><td style="padding: 8px;"><strong>Cliente:</strong></td><td style="padding: 8px;">${clientName}</td></tr>
          </table>

          <h3>Productos</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px;">Código</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Producto</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Cantidad</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Precio Unitario</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
              ${discountsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Total:</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(invoiceDetails.montoTotal)}</td>
              </tr>
            </tfoot>
          </table>

          <h3>Métodos de Pago</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px;">Método</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsHtml}
            </tbody>
          </table>

          <p>Gracias por tu compra. Si tienes alguna pregunta, contáctanos en ${process.env.EMAIL_USER}.</p>
          <p>Atentamente,<br>Equipo Tienda</p>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${clientEmail} for invoice ${invoiceDetails.numeroFactura}`);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new Error('Failed to send invoice email');
  }
}

module.exports = { sendInvoiceEmail };