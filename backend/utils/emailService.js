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
 * Outbound email service supporting standard SMTP (local / open hosts)
 * and HTTPS REST APIs (Brevo, Resend) to bypass cloud provider firewall blocks (e.g., Render free tier).
 */
export async function sendEmailReceipt(toAddress, subject, bodyText, htmlAttachmentContent = null, variables = {}, attachments = []) {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM?.trim() || 'Aynkaran Consultants <onboarding@resend.dev>';

  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER?.trim() || 'info.aynkaranconsultants@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim() || 'dylkcttauwbpxdwh';
  const senderEmail = process.env.EMAIL_FROM?.trim() || process.env.SMTP_FROM?.trim() || process.env.SENDER_EMAIL?.trim() || smtpUser;
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

  // 1. If Brevo HTTP API is configured (HTTPS port 443 - works everywhere including Render without domain verification restrictions)
  if (brevoApiKey) {
    try {
      console.log(`[Email Dispatcher] Attempting delivery via Brevo HTTPS API to <${toAddress}>...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: toAddress }],
          subject: finalSubject,
          textContent: finalBodyText,
          htmlContent: finalHtml
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP ${response.status}`);
      }
      console.log(`[Email Dispatcher] Email delivered via Brevo API. MessageId: ${data.messageId}`);
      return { status: 'delivered', success: true, messageId: data.messageId, gateway: 'Brevo HTTPS API' };
    } catch (brevoErr) {
      console.warn('[Email Dispatcher] Brevo API delivery failed:', brevoErr.message);
    }
  }

  // 2. Standard SMTP Transports (Port 465 SSL, Gmail service, Port 587 STARTTLS)
  if (smtpUser && smtpPass) {
    const isGmail = smtpHost.includes('gmail.com') || smtpUser.includes('@gmail.com');
    const transportConfigs = [];

    if (isGmail) {
      transportConfigs.push({
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
      });
      transportConfigs.push({
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
      });
    } else {
      transportConfigs.push({
        name: `Custom SMTP (${smtpHost}:${smtpPort})`,
        options: {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 12000
        }
      });
    }

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
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
      } catch (err) {
        console.warn(`[Email Dispatcher] ${config.name} failed: ${err.message}.`);
      } finally {
        if (transporter && typeof transporter.close === 'function') {
          try { transporter.close(); } catch (_) {}
        }
      }
    }
  }

  // 3. Fallback: Resend HTTPS API (if configured)
  if (resendApiKey) {
    try {
      console.log(`[Email Dispatcher] Attempting delivery via Resend HTTPS API to <${toAddress}>...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [toAddress],
          reply_to: senderEmail,
          subject: finalSubject,
          text: finalBodyText,
          html: finalHtml
        }),
        signal: AbortSignal.timeout(10000)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.id) {
        console.log(`[Email Dispatcher] Email accepted by Resend. MessageId: ${result.id}`);
        return { status: 'delivered', success: true, messageId: result.id, gateway: 'Resend HTTPS API' };
      }
      
      // If Resend rejected external recipient due to trial domain restrictions, send copy to admin inbox
      if (result.message && result.message.includes('only send testing emails')) {
        console.warn(`[Email Dispatcher] Resend trial restrictions active. Redirecting notification for <${toAddress}> to verified admin inbox: ${senderEmail}`);
        const fallbackRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [senderEmail],
            reply_to: senderEmail,
            subject: `[Candidate Notice: ${toAddress}] ${finalSubject}`,
            text: `[Intended Recipient: ${toAddress}]\n\n${finalBodyText}`,
            html: `
              <div style="background-color: #fee2e2; border: 1px solid #fecaca; color: #991b1b; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
                <strong>Sandbox Notice:</strong> This message was destined for <strong>${toAddress}</strong>, but delivered to admin mailbox due to cloud domain sandbox.
              </div>
              ${finalHtml}
            `
          })
        });
        const fbResult = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok && fbResult.id) {
          return { status: 'delivered', success: true, messageId: fbResult.id, gateway: 'Resend API (Admin Redirect)' };
        }
      }
      throw new Error(result.message || `Resend returned HTTP ${response.status}`);
    } catch (resendErr) {
      console.warn('[Email Dispatcher] Resend API fallback failed:', resendErr.message);
    }
  }

  // If all methods failed
  return {
    status: 'failed',
    success: false,
    error: 'Cloud provider firewall blocked outbound SMTP ports (25/465/587). Please use an HTTPS email API (e.g. Brevo or verified Resend domain).'
  };
}
