/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider-Independent WhatsApp Integration Adapter
 * Supports configurable custom WhatsApp endpoints, auth headers, parameter mappings,
 * template variable interpolation, media attachments, and local development simulation.
 */
export class WhatsAppService {
  /**
   * Helper: Replace template variable placeholders like {{candidateName}}
   */
  static interpolateVariables(templateText, variables = {}) {
    if (!templateText) return '';
    let result = templateText;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
    }
    return result;
  }

  /**
   * Send single or templated WhatsApp message
   */
  static async sendMessage({
    recipient,
    message,
    templateId = null,
    variables = {},
    mediaUrl = null,
    providerConfig = null
  }) {
    if (!recipient) {
      throw new Error('Recipient mobile number is mandatory for WhatsApp dispatch.');
    }

    const cleanNumber = String(recipient).replace(/\D/g, '').trim();
    const targetMobile = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;

    const formattedMessage = this.interpolateVariables(message, variables);

    // Provider Gateway Configuration from environment or options
    const apiUrl = providerConfig?.apiUrl || process.env.WHATSAPP_SENDER_API_URL || process.env.WHATSAPP_API_URL;
    const httpMethod = (providerConfig?.method || process.env.WHATSAPP_SENDER_METHOD || process.env.WHATSAPP_METHOD || 'POST').toUpperCase();
    const phoneParam = providerConfig?.phoneParam || process.env.WHATSAPP_SENDER_PHONE_PARAM || 'phone';
    const msgParam = providerConfig?.messageParam || process.env.WHATSAPP_SENDER_MESSAGE_PARAM || 'message';
    const authParam = providerConfig?.authParam || process.env.WHATSAPP_SENDER_AUTH_PARAM || 'apikey';
    const authVal = providerConfig?.apiKey || process.env.WHATSAPP_SENDER_AUTH_VAL || process.env.WHATSAPP_API_KEY || '';
    const senderNumber = providerConfig?.senderNumber || process.env.WHATSAPP_SENDER_NUMBER;

    // 1. Live Gateway Dispatch if apiUrl is configured
    if (apiUrl) {
      try {
        console.log(`[WhatsApp Gateway] Dispatching to ${targetMobile} via ${apiUrl} [Method: ${httpMethod}]...`);

        let response;
        if (httpMethod === 'GET') {
          const urlObj = new URL(apiUrl, apiUrl.startsWith('http') ? undefined : 'http://localhost');
          urlObj.searchParams.set(phoneParam, targetMobile);
          urlObj.searchParams.set(msgParam, formattedMessage);
          if (authVal && authParam) {
            urlObj.searchParams.set(authParam, authVal);
          }
          if (senderNumber) {
            urlObj.searchParams.set('from', senderNumber);
          }
          if (mediaUrl) {
            urlObj.searchParams.set('media_url', mediaUrl);
          }

          response = await fetch(urlObj.toString(), {
            method: 'GET',
            headers: {
              ...(authVal && authParam === 'Authorization' ? { Authorization: `Bearer ${authVal}` } : {}),
              ...(providerConfig?.headers || {})
            }
          });
        } else {
          // POST / PUT dispatch
          const headers = {
            'Content-Type': 'application/json',
            ...(authVal && authParam === 'Authorization' ? { Authorization: `Bearer ${authVal}` } : {}),
            ...(providerConfig?.headers || {})
          };

          const payload = {
            [phoneParam]: targetMobile,
            [msgParam]: formattedMessage,
            ...(authVal && authParam && authParam !== 'Authorization' ? { [authParam]: authVal } : {}),
            ...(senderNumber ? { from: senderNumber } : {}),
            ...(mediaUrl ? { mediaUrl, type: 'media' } : { type: 'text' }),
            ...(templateId ? { templateId } : {}),
            parameters: variables
          };

          response = await fetch(apiUrl, {
            method: httpMethod,
            headers,
            body: JSON.stringify(payload)
          });
        }

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (_) {
          responseData = { rawResponse: responseText, status: response.status };
        }

        if (!response.ok) {
          throw new Error(`WhatsApp Gateway Error (${response.status}): ${JSON.stringify(responseData)}`);
        }

        return {
          success: true,
          providerMessageId: responseData.messageId || responseData.id || responseData.msgId || `wa-${Date.now()}`,
          provider: 'Live WhatsApp API Gateway',
          status: 'SENT',
          messageBody: formattedMessage,
          deliveredAt: new Date().toISOString(),
          details: responseData
        };
      } catch (err) {
        console.error('[WhatsApp Gateway Failure]', err.message);
        return {
          success: false,
          error: err.message,
          provider: 'Live WhatsApp API Gateway',
          status: 'FAILED',
          messageBody: formattedMessage
        };
      }
    }

    // 2. Simulation & Sandbox Fallback (when no external gateway credentials configured)
    console.log(`[WhatsApp Adapter] (SIMULATION MODE)`);
    console.log(`[WhatsApp Target]: ${targetMobile} (original: ${recipient})`);
    console.log(`[WhatsApp Message]: ${formattedMessage}`);

    return {
      success: true,
      simulated: true,
      providerMessageId: `sim-wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      provider: 'Simulation Mode - Define WHATSAPP_API_URL and WHATSAPP_API_KEY to activate live API.',
      status: 'SENT',
      messageBody: formattedMessage,
      deliveredAt: new Date().toISOString()
    };
  }

  /**
   * Batch dispatch to multiple recipients with rate throttling
   */
  static async sendBatch(recipients = [], messageTemplate, variablesList = [], delayMs = 150) {
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const vars = variablesList[i] || {};
      const res = await this.sendMessage({
        recipient,
        message: messageTemplate,
        variables: vars
      });
      results.push(res);
      if (delayMs > 0 && i < recipients.length - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    return results;
  }
}
