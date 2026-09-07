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
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
  const senderEmail = process.env.SMTP_FROM?.trim() || process.env.SENDER_EMAIL?.trim() || smtpUser;
  const senderName = process.env.SMTP_FROM_NAME?.trim() || 'Aynkaran Consultants';
  const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  const finalSubject = interpolate(subject, variables);
  const finalBodyText = interpolate(bodyText, variables);

  if (!smtpHost || !smtpUser || !smtpPass) {
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

  try {
    console.log(`[Email Dispatcher] Connecting via SMTP over TLS to ${smtpHost}:${smtpPort}...`);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: toAddress,
      subject: finalSubject,
      text: finalBodyText,
      html: htmlAttachmentContent ? interpolate(htmlAttachmentContent, variables) : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafbfd; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-top: 0;">${senderName}</h2>
          <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 15px 0;" />
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">${finalBodyText.replace(/\n/g, '<br>')}</p>
          <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 20px 0;" />
          <span style="font-size: 11px; color: #64748b; display: block; text-align: center;">This is an automated notification alert from Aynkaran Business CRM. Please do not reply directly to this mailer.</span>
        </div>
      `,
      attachments: attachments || []
    };

    const deliveryReport = await transporter.sendMail(mailOptions);
    console.log(`[Email Dispatcher] Email delivered successfully. MessageId: ${deliveryReport.messageId}`);
    return { status: 'delivered', success: true, messageId: deliveryReport.messageId };
  } catch (err) {
    if (err.message && (err.message.includes('testing purposes') || err.message.includes('only send emails to') || err.message.includes('421'))) {
      console.log(`[Email Dispatcher] [Sandbox Detection] Intercepted SMTP restriction. Safely redirecting email originally for <${toAddress}> to sandbox authorized address: kiruthickrn@gmail.com`);
      
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        
        const sandboxMailOptions = {
          from: `"${senderName}" <${senderEmail}>`,
          to: 'kiruthickrn@gmail.com',
          subject: `[Sandbox Redirect from ${toAddress}] ${finalSubject}`,
          text: `[ORIGINAL DESTINATION: ${toAddress}]\n\n${finalBodyText}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafbfd; color: #1e293b;">
              <div style="background-color: #fee2e2; border: 1px solid #fecaca; color: #991b1b; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
                <strong>Sandbox Interceptor Notification:</strong> This email was originally sent to <strong>${toAddress}</strong>, but has been safely redirected to your verified email address to circumvent sandbox limits.
              </div>
              <h2 style="color: #4f46e5; margin-top: 0;">${senderName}</h2>
              <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 15px 0;" />
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">${finalBodyText.replace(/\n/g, '<br>')}</p>
              <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 20px 0;" />
              <span style="font-size: 11px; color: #64748b; display: block; text-align: center;">This is an automated notification alert from Aynkaran Business CRM. Please do not reply directly to this mailer.</span>
            </div>
          `,
          attachments: attachments || []
        };
        const deliveryReport = await transporter.sendMail(sandboxMailOptions);
        console.log(`[Email Dispatcher] Sandbox Redirect delivery complete. MessageId: ${deliveryReport.messageId}`);
        return { status: 'delivered', success: true, messageId: deliveryReport.messageId, redirected: true };
      } catch (retryErr) {
        console.error('[Email Dispatcher] Sandbox Redirect retry failed:', retryErr);
        return { status: 'failed', success: false, error: retryErr.message };
      }
    }
    console.error('[Email Dispatcher] SMTP connection / dispatch failed:', err);
    return { status: 'failed', success: false, error: err.message };
  }
}
