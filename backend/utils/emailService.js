/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

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
 * Unified Outbound Email Courier:
 * 1. Resend HTTPS API (Port 443): Bypasses cloud hosting firewall blocks (Render/Vercel) using verified domain @aynkaranconsultants.in.
 * 2. Nodemailer SMTP (Port 465 SSL / 587 STARTTLS): Direct delivery for local dev / unblocked hosts.
 */
export async function sendEmailReceipt(toAddress, subject, bodyText, htmlAttachmentContent = null, variables = {}, attachments = []) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER?.trim() || 'info.aynkaranconsultants@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim() || 'dylkcttauwbpxdwh';
  
  // Official domain sender with fallback
  const domainSenderEmail = process.env.EMAIL_FROM?.trim() || 'info@aynkaranconsultants.in';
  const replyToEmail = process.env.REPLY_TO_EMAIL?.trim() || 'info.aynkaranconsultants@gmail.com';
  const senderName = process.env.SMTP_FROM_NAME?.trim() || 'Aynkaran Consultants';

  const finalSubject = interpolate(subject, variables);
  const finalBodyText = interpolate(bodyText, variables);
  const finalHtml = htmlAttachmentContent ? interpolate(htmlAttachmentContent, variables) : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafbfd; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0;">${senderName}</h2>
      <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 15px 0;" />
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">${finalBodyText.replace(/\n/g, '<br>')}</p>
      <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 20px 0;" />
      <span style="font-size: 11px; color: #64748b; display: block; text-align: center;">This is an automated notification alert from Aynkaran Business CRM. Replies will be routed to ${replyToEmail}.</span>
    </div>
  `;

  // 1. Resend HTTPS API (Primary for Render Cloud Deployment)
  if (resendApiKey) {
    try {
      console.log(`[Email Dispatcher] Attempting delivery via Resend HTTPS API to <${toAddress}>...`);
      
      const resendAttachments = await Promise.all((attachments || []).map(async attachment => {
        let content = attachment.content;
        if (content === undefined && attachment.path) {
          if (/^https?:\/\//i.test(attachment.path)) {
            const response = await fetch(attachment.path);
            if (!response.ok) throw new Error(`Unable to fetch email attachment (${response.status}).`);
            content = Buffer.from(await response.arrayBuffer());
          } else {
            content = await readFile(attachment.path);
          }
        }
        if (content === undefined) throw new Error('Email attachment is missing content or a readable path.');
        return {
          filename: attachment.filename || (attachment.path ? path.basename(attachment.path) : 'attachment'),
          content: Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64')
        };
      }));

      // Determine sender format
      const fromHeader = domainSenderEmail.includes('<') 
        ? domainSenderEmail 
        : `${senderName} <${domainSenderEmail}>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [toAddress],
          reply_to: replyToEmail,
          subject: finalSubject,
          text: finalBodyText,
          html: finalHtml,
          ...(resendAttachments.length ? { attachments: resendAttachments } : {})
        }),
        signal: AbortSignal.timeout(12000)
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.id) {
        console.log(`[Email Dispatcher] Email delivered via Resend API. MessageId: ${result.id}`);
        return { status: 'delivered', success: true, messageId: result.id, gateway: `Resend API (${domainSenderEmail})` };
      }

      console.warn('[Email Dispatcher] Resend API response error:', result);
      // If domain not yet verified, provide clear feedback
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error(`Resend API returned HTTP ${response.status}`);
    } catch (resendError) {
      console.warn('[Email Dispatcher] Resend API failed, attempting SMTP fallback:', resendError.message);
      // Proceed to SMTP fallback
    }
  }

  // 2. Direct SMTP Fallback (Nodemailer Port 465 SSL / Port 587)
  if (smtpUser && smtpPass) {
    const transportConfigs = [
      {
        name: 'Gmail SSL (Port 465)',
        options: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 12000
        }
      },
      {
        name: 'Gmail STARTTLS (Port 587)',
        options: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 12000
        }
      }
    ];

    const mailOptions = {
      from: `"${senderName}" <${smtpUser}>`,
      to: toAddress,
      subject: finalSubject,
      text: finalBodyText,
      html: finalHtml,
      attachments: attachments || []
    };

    for (const config of transportConfigs) {
      let transporter = null;
      try {
        console.log(`[Email Dispatcher] Attempting delivery via ${config.name} to <${toAddress}>...`);
        transporter = nodemailer.createTransport(config.options);
        const deliveryReport = await transporter.sendMail(mailOptions);
        console.log(`[Email Dispatcher] Email delivered successfully via ${config.name}. MessageId: ${deliveryReport.messageId}`);
        return { 
          status: 'delivered', 
          success: true, 
          messageId: deliveryReport.messageId,
          gateway: config.name
        };
      } catch (smtpErr) {
        console.warn(`[Email Dispatcher] ${config.name} failed: ${smtpErr.message}`);
      } finally {
        if (transporter && typeof transporter.close === 'function') {
          try { transporter.close(); } catch (_) {}
        }
      }
    }
  }

  return {
    status: 'failed',
    success: false,
    error: 'All email delivery channels failed. Ensure domain DNS records are verified on Resend or outbound SMTP ports are accessible.'
  };
}
