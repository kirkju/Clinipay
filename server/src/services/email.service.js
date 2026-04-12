const { transporter, SMTP_FROM } = require('../config/email');

const BRAND_COLOR = '#3EB489';
const BRAND_NAME = 'CLINIPAY';

/**
 * Shared email layout wrapper with CLINIPAY branding.
 */
function emailLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background-color:${BRAND_COLOR};padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:1px;">${BRAND_NAME}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 24px;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#f9f9f9;padding:16px 24px;text-align:center;font-size:12px;color:#888888;">
          <p style="margin:0;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const EmailService = {
  /**
   * Send a welcome email after registration.
   */
  async sendWelcomeEmail(user, language = 'es') {
    const isEs = language === 'es';
    const subject = isEs ? 'Bienvenido a CLINIPAY' : 'Welcome to CLINIPAY';
    const body = isEs
      ? `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hola ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">
           Gracias por registrarte en <strong>${BRAND_NAME}</strong>. Ahora puedes explorar nuestros paquetes m&eacute;dicos y realizar tu primera compra de forma segura.
         </p>
         <p style="font-size:16px;color:#333333;line-height:1.6;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
         <p style="font-size:16px;color:#333333;">El equipo de ${BRAND_NAME}</p>`
      : `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hello ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">
           Thank you for registering with <strong>${BRAND_NAME}</strong>. You can now explore our medical packages and make your first purchase securely.
         </p>
         <p style="font-size:16px;color:#333333;line-height:1.6;">If you have any questions, feel free to contact us.</p>
         <p style="font-size:16px;color:#333333;">The ${BRAND_NAME} Team</p>`;

    const html = emailLayout(subject, body);

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: user.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email] Failed to send welcome email:', error.message);
    }
  },

  /**
   * Send a password-reset email with a link.
   */
  async sendPasswordResetEmail(user, resetUrl, language = 'es') {
    const isEs = language === 'es';
    const subject = isEs ? 'Restablecer tu contrase\u00f1a - CLINIPAY' : 'Reset your password - CLINIPAY';
    const body = isEs
      ? `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hola ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">
           Recibimos una solicitud para restablecer tu contrase&ntilde;a. Haz clic en el bot&oacute;n de abajo para continuar:
         </p>
         <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
           <tr><td style="background-color:${BRAND_COLOR};border-radius:6px;padding:14px 28px;">
             <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Restablecer Contrase&ntilde;a</a>
           </td></tr>
         </table>
         <p style="font-size:14px;color:#666666;line-height:1.6;">
           Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
         </p>
         <p style="font-size:12px;color:#999999;word-break:break-all;">${resetUrl}</p>`
      : `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hello ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">
           We received a request to reset your password. Click the button below to continue:
         </p>
         <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
           <tr><td style="background-color:${BRAND_COLOR};border-radius:6px;padding:14px 28px;">
             <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Reset Password</a>
           </td></tr>
         </table>
         <p style="font-size:14px;color:#666666;line-height:1.6;">
           This link expires in 1 hour. If you did not request this, please ignore this email.
         </p>
         <p style="font-size:12px;color:#999999;word-break:break-all;">${resetUrl}</p>`;

    const html = emailLayout(subject, body);

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: user.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email] Failed to send password reset email:', error.message);
    }
  },

  /**
   * Send an order confirmation to the customer.
   * @param {Object} user
   * @param {Object} order - order header with total_amount, currency, order_number
   * @param {Array}  items - order items with package names and patient info
   * @param {string} language
   */
  async sendOrderConfirmation(user, order, items, language = 'es') {
    const isEs = language === 'es';
    const total = Number(order.total_amount).toFixed(2);

    const itemRows = items.map((item, idx) => {
      const pkgName = isEs ? item.package_name_es : (item.package_name_en || item.package_name_es);
      const bg = idx % 2 === 0 ? 'background-color:#f9f9f9;' : '';
      return `<tr style="${bg}"><td style="color:#333;padding:8px;">${pkgName}</td><td style="color:#333;padding:8px;">${item.patient_first_name} ${item.patient_last_name}</td><td style="color:#333;padding:8px;">${item.currency || order.currency} ${Number(item.unit_price).toFixed(2)}</td></tr>`;
    }).join('');

    const subject = isEs
      ? `Confirmaci\u00f3n de orden ${order.order_number} - CLINIPAY`
      : `Order confirmation ${order.order_number} - CLINIPAY`;
    const body = isEs
      ? `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hola ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">Tu orden ha sido creada exitosamente.</p>
         <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
           <tr style="background-color:#f9f9f9;"><td style="font-weight:bold;color:#555;">N&uacute;mero de Orden</td><td colspan="2" style="color:#333;">${order.order_number}</td></tr>
         </table>
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
           <tr style="background-color:${BRAND_COLOR};"><th style="color:#fff;padding:8px;text-align:left;">Paquete</th><th style="color:#fff;padding:8px;text-align:left;">Paciente</th><th style="color:#fff;padding:8px;text-align:left;">Precio</th></tr>
           ${itemRows}
           <tr style="background-color:#f0f0f0;"><td colspan="2" style="font-weight:bold;color:#555;padding:8px;text-align:right;">Total</td><td style="font-weight:bold;color:#333;padding:8px;">${order.currency} ${total}</td></tr>
         </table>
         <p style="font-size:16px;color:#333333;">Gracias por confiar en ${BRAND_NAME}.</p>`
      : `<h2 style="color:${BRAND_COLOR};margin-top:0;">Hello ${user.first_name},</h2>
         <p style="font-size:16px;color:#333333;line-height:1.6;">Your order has been created successfully.</p>
         <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
           <tr style="background-color:#f9f9f9;"><td style="font-weight:bold;color:#555;">Order Number</td><td colspan="2" style="color:#333;">${order.order_number}</td></tr>
         </table>
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
           <tr style="background-color:${BRAND_COLOR};"><th style="color:#fff;padding:8px;text-align:left;">Package</th><th style="color:#fff;padding:8px;text-align:left;">Patient</th><th style="color:#fff;padding:8px;text-align:left;">Price</th></tr>
           ${itemRows}
           <tr style="background-color:#f0f0f0;"><td colspan="2" style="font-weight:bold;color:#555;padding:8px;text-align:right;">Total</td><td style="font-weight:bold;color:#333;padding:8px;">${order.currency} ${total}</td></tr>
         </table>
         <p style="font-size:16px;color:#333333;">Thank you for choosing ${BRAND_NAME}.</p>`;

    const html = emailLayout(subject, body);

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: user.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email] Failed to send order confirmation:', error.message);
    }
  },

  /**
   * Notify admins of a new order.
   * @param {Object} order
   * @param {Object} user
   * @param {Array}  items
   */
  async sendAdminNewOrderNotification(order, user, items) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_FROM;
    if (!adminEmail) return;

    const total = Number(order.total_amount).toFixed(2);
    const itemList = items.map(i =>
      `<li style="margin:4px 0;">${i.package_name_en || i.package_name_es} — ${i.patient_first_name} ${i.patient_last_name} ($${Number(i.unit_price).toFixed(2)})</li>`
    ).join('');

    const subject = `New Order ${order.order_number} - CLINIPAY Admin`;
    const body = `
      <h2 style="color:${BRAND_COLOR};margin-top:0;">New Order Received</h2>
      <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
        <tr style="background-color:#f9f9f9;"><td style="font-weight:bold;color:#555;">Order Number</td><td style="color:#333;">${order.order_number}</td></tr>
        <tr><td style="font-weight:bold;color:#555;">Customer</td><td style="color:#333;">${user.first_name} ${user.last_name} (${user.email})</td></tr>
        <tr style="background-color:#f9f9f9;"><td style="font-weight:bold;color:#555;">Items (${items.length})</td><td style="color:#333;"><ul style="margin:0;padding-left:16px;">${itemList}</ul></td></tr>
        <tr><td style="font-weight:bold;color:#555;">Total</td><td style="color:#333;">${order.currency} ${total}</td></tr>
      </table>`;

    const html = emailLayout(subject, body);

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: adminEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('[Email] Failed to send admin notification:', error.message);
    }
  },
};

module.exports = EmailService;
