/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';

/**
 * Interpolate template variables into message string
 */
function interpolate(templateStr, vars = {}) {
  if (!templateStr) return '';
  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
}

/**
 * Production SMTP-based outbound email courier with TLS secure transmission
 */
export async function sendEmailReceipt(toAddress, subject, bodyText, htmlAttachmentContent = null, variables = {}, attachments = []) {
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER?.trim() || 'info.aynkaranconsultants@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim() || 'dylkcttauwbpxdwh';
  const senderEmail = process.env.SMTP_FROM?.trim() || process.env.SENDER_EMAIL?.trim() || smtpUser;
  const senderName = process.env.SMTP_FROM_NAME?.trim() || 'Aynkaran Consultants';

  const finalSubject = interpolate(subject, variables);
  const finalBodyText = interpolate(bodyText, variables);
  const finalHtml = htmlAttachmentContent ? interpolate(htmlAttachmentContent, variables) : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafbfd; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0;">${senderName}</h2>
      <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 15px 0;" />
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">${finalBodyText.replace(/\n/g, '<br>')}</p>
      <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 20px 0;" />
      <span style="font-size: 11px; color: #64748b; display: block; text-align: center;">This is an automated notification alert from Aynkaran Business CRM. Please do not reply directly to this mailer.</span>
    </div>
  `;

  if (!smtpUser || !smtpPass) {
    console.log('[Email Dispatcher] (Simulation Mode) SMTP configuration keys are unassigned.');
    console.log(`[Email Target]: ${toAddress}`);
    console.log(`[Email Subject]: ${finalSubject}`);
    console.log(`[Email Payload]: ${finalBodyText.slice(0, 120)}...`);
    return { 
      status: 'simulated', 
      success: true, 
      simulated: true,
      messageId: `sim-mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      gateway: 'Simulation Mode - Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD to activate live delivery.' 
    };
  }

  const transportConfigs = [
    {
      name: 'Gmail SSL (Port 465)',
      options: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      }
    },
    {
      name: 'Gmail STARTTLS (Port 587)',
      options: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      }
    }
  ];

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: toAddress,
    subject: finalSubject,
    text: finalBodyText,
    html: finalHtml,
    attachments: attachments || []
  };

  let lastError = null;

  for (const config of transportConfigs) {
    let transporter = null;
    try {
      console.log(`[Email Dispatcher] Connecting via ${config.name} to send to <${toAddress}>...`);
      transporter = nodemailer.createTransport(config.options);
      const deliveryReport = await transporter.sendMail(mailOptions);
      console.log(`[Email Dispatcher] Email delivered successfully via ${config.name}. MessageId: ${deliveryReport.messageId}`);
      return { 
        status: 'delivered', 
        success: true, 
        messageId: deliveryReport.messageId,
        gateway: config.name
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Email Dispatcher] ${config.name} failed: ${err.message}. Trying next strategy...`);
    } finally {
      if (transporter && typeof transporter.close === 'function') {
        try { transporter.close(); } catch (_) {}
      }
    }
  }

  console.error('[Email Dispatcher] SMTP connection / dispatch failed:', lastError);
  return { status: 'failed', success: false, error: lastError?.message || 'SMTP Connection failed' };
}
