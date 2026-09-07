/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

<<<<<<< HEAD
import { WhatsAppService } from '../services/whatsappService.js';

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
 * Secure unified high performance SMS and instant WhatsApp messenger dispatcher
 */
export async function sendSMSNotification(mobileNumber, messageBody, variables = {}) {
  if (!mobileNumber) return { success: false, error: 'Mobile number is required' };

  const isWhatsApp = String(mobileNumber).startsWith('whatsapp:') || String(mobileNumber).includes('whatsapp');
  const finalMessage = interpolate(messageBody, variables);

  // 1. Dynamic Route: If WhatsApp, forward to WhatsAppService
  if (isWhatsApp) {
    return WhatsAppService.sendMessage({
      recipient: mobileNumber,
      message: finalMessage,
      variables
    });
  }

  const cleanNum = String(mobileNumber).replace(/\D/g, '').trim();
  const targetMobile = cleanNum.length === 10 ? '91' + cleanNum : cleanNum;

  // 2. Standard SMS target: Route through Digital SMS Carrier Gateway if configured
  const digitalSmsApiKey = process.env.SMS_API_KEY || process.env.DIGITALSMS_API_KEY;
  if (digitalSmsApiKey) {
    const digitalSmsSender = process.env.SMS_SENDER_ID || process.env.DIGITALSMS_SENDER_ID || 'AYNKAR';
    const digitalSmsRoute = process.env.SMS_ROUTE || process.env.DIGITALSMS_ROUTE || '4'; // common transactional route
    const digitalSmsApiUrl = process.env.SMS_API_URL || process.env.DIGITALSMS_API_URL || 'http://login.digitalsms.co.in/api/send_http.php';
    const dltEntityId = process.env.DIGITALSMS_DLT_ENTITY_ID || '';
    const dltTemplateId = process.env.SMS_TEMPLATE_ID || process.env.DIGITALSMS_DLT_TEMPLATE_ID || '';

    try {
      console.log(`[SMS Hub] Dispatching live Digital SMS API request to target: ${targetMobile}`);
=======
/**
 * Secure unified high performance SMS and instant WhatsApp messenger dispatcher
 */
export async function sendSMSNotification(mobileNumber, messageBody) {
  const cleanNum = mobileNumber.replace('whatsapp:', '').replace(/\s+/g, '').replace(/\+/g, '').trim();
  const targetMobile = cleanNum.length === 10 ? '91' + cleanNum : cleanNum;
  let isWhatsApp = mobileNumber.startsWith('whatsapp:') || mobileNumber.includes('whatsapp');

  // 1. Dynamic Route: Custom WhatsApp Bulk Message Sender integration
  const whatsappApiUrl = process.env.WHATSAPP_SENDER_API_URL;
  if (isWhatsApp && whatsappApiUrl) {
    const whatsappMethod = (process.env.WHATSAPP_SENDER_METHOD || 'GET').toUpperCase();
    const phoneParam = process.env.WHATSAPP_SENDER_PHONE_PARAM || 'phone';
    const messageParam = process.env.WHATSAPP_SENDER_MESSAGE_PARAM || 'message';
    const authParam = process.env.WHATSAPP_SENDER_AUTH_PARAM || '';
    const authVal = process.env.WHATSAPP_SENDER_AUTH_VAL || '';

    try {
      console.log(`[Messaging Hub] Routing automated notification to Custom WhatsApp Bulk Sender API for target: ${targetMobile}`);
      
      let requestUrl = whatsappApiUrl;
      const headers = {};
      let bodyContent = null;

      if (authParam && authParam.toLowerCase() === 'authorization' && authVal) {
        headers['Authorization'] = authVal.startsWith('Bearer ') ? authVal : `Bearer ${authVal}`;
      }

      if (whatsappMethod === 'GET') {
        const queryParams = new URLSearchParams();
        queryParams.append(phoneParam, targetMobile);
        queryParams.append(messageParam, messageBody);
        if (authParam && authParam.toLowerCase() !== 'authorization' && authVal) {
          queryParams.append(authParam, authVal);
        }
        const separator = requestUrl.includes('?') ? '&' : '?';
        requestUrl = `${requestUrl}${separator}${queryParams.toString()}`;
      } else {
        // POST Request type
        headers['Content-Type'] = 'application/json';
        const postData = {
          [phoneParam]: targetMobile,
          [messageParam]: messageBody
        };
        if (authParam && authParam.toLowerCase() !== 'authorization' && authVal) {
          postData[authParam] = authVal;
        }
        bodyContent = JSON.stringify(postData);
      }

      console.log(`[Messaging Hub] Sending custom WhatsApp request: ${whatsappMethod} -> ${requestUrl}`);
      const options = {
        method: whatsappMethod,
        headers
      };
      if (bodyContent) {
        options.body = bodyContent;
      }

      const response = await fetch(requestUrl, options);
      const logText = await response.text();

      console.log(`[Messaging Hub] WhatsApp Bulk Sender Gateway Response status: ${response.status}. Payload: ${logText}`);
      return {
        success: response.ok,
        response: logText,
        gateway: 'Automated WhatsApp Bulk Sender API'
      };
    } catch (err) {
      console.error('[Messaging Hub] Custom WhatsApp Bulk Sender API dispatch failed:', err);
      return {
        success: false,
        error: err.message,
        gateway: 'WhatsApp Bulk Sender API Error'
      };
    }
  }

  // 2. Standard SMS target: Route through Digital SMS Carrier Gateway if configured
  const digitalSmsApiKey = process.env.DIGITALSMS_API_KEY;
  if (!isWhatsApp && digitalSmsApiKey) {
    const digitalSmsSender = process.env.DIGITALSMS_SENDER_ID || 'AYNKAR';
    const digitalSmsRoute = process.env.DIGITALSMS_ROUTE || '4'; // common transactional route
    const digitalSmsApiUrl = process.env.DIGITALSMS_API_URL || 'http://login.digitalsms.co.in/api/send_http.php';
    const dltEntityId = process.env.DIGITALSMS_DLT_ENTITY_ID || '';
    const dltTemplateId = process.env.DIGITALSMS_DLT_TEMPLATE_ID || '';

    try {
      console.log(`[Messaging Hub] Dispatching live Digital SMS API request to target: ${targetMobile}`);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      
      const queryParams = new URLSearchParams({
        authkey: digitalSmsApiKey,
        mobiles: targetMobile,
<<<<<<< HEAD
        message: finalMessage,
=======
        message: messageBody,
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
        sender: digitalSmsSender,
        route: digitalSmsRoute,
      });

<<<<<<< HEAD
      if (dltEntityId) queryParams.append('DLT_TE_ID', dltEntityId);
      if (dltTemplateId) queryParams.append('DLT_PE_ID', dltTemplateId);

      const requestUrl = `${digitalSmsApiUrl}?${queryParams.toString()}`;
      const response = await fetch(requestUrl);
      const logText = await response.text();

      console.log(`[SMS Hub] Digital SMS Gateway Response Code: ${response.status}. Payload: ${logText}`);
=======
      if (dltEntityId) {
        queryParams.append('DLT_TE_ID', dltEntityId);
      }
      if (dltTemplateId) {
        queryParams.append('DLT_PE_ID', dltTemplateId);
      }

      const requestUrl = `${digitalSmsApiUrl}?${queryParams.toString()}`;
      console.log(`[Messaging Hub] Sending GET request to Digital SMS gateway`);

      const response = await fetch(requestUrl);
      const logText = await response.text();

      console.log(`[Messaging Hub] Digital SMS Gateway Response Code: ${response.status}. Payload: ${logText}`);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      
      return { 
        success: response.ok, 
        response: logText, 
<<<<<<< HEAD
        messageBody: finalMessage,
        providerMessageId: `sms-${Date.now()}`,
        gateway: 'Digital SMS Carrier Gateway' 
      };
    } catch (err) {
      console.error('[SMS Hub] Digital SMS API dispatcher failed:', err);
      return { 
        success: false, 
        error: err.message, 
        messageBody: finalMessage,
=======
        gateway: 'Digital SMS Carrier Gateway' 
      };
    } catch (err) {
      console.error('[Messaging Hub] Digital SMS API dispatcher failed:', err);
      return { 
        success: false, 
        error: err.message, 
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
        gateway: 'Digital SMS Carrier Error' 
      };
    }
  }

  // 3. Fallback: Simulation Logging (when no live API gateways match)
<<<<<<< HEAD
  console.log(`[SMS Hub] [SIMULATION] Mobile dispatch target: ${mobileNumber}`);
  console.log(`[SMS Hub] [SIMULATION] Message: "${finalMessage}"`);
  return {
    success: true,
    simulated: true,
    messageBody: finalMessage,
    providerMessageId: `sim-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gateway: 'Simulation Mode - Configure SMS_API_KEY or DIGITALSMS_API_KEY to activate live gateways.'
=======
  console.log(`[Messaging Hub] [SIMULATION] Mobile dispatch target: ${mobileNumber}`);
  console.log(`[Messaging Hub] [SIMULATION] Message: "${messageBody}"`);
  return {
    success: true,
    simulated: true,
    gateway: 'Simulation Mode - Configure WHATSAPP_SENDER_API_URL or DIGITALSMS_API_KEY to activate live gateways.'
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
  };
}
