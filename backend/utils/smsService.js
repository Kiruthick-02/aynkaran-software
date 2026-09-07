
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
      
      const queryParams = new URLSearchParams({
        authkey: digitalSmsApiKey,
        mobiles: targetMobile,
        message: finalMessage,
        sender: digitalSmsSender,
        route: digitalSmsRoute,
      });

      if (dltEntityId) queryParams.append('DLT_TE_ID', dltEntityId);
      if (dltTemplateId) queryParams.append('DLT_PE_ID', dltTemplateId);

      const requestUrl = `${digitalSmsApiUrl}?${queryParams.toString()}`;
      const response = await fetch(requestUrl);
      const logText = await response.text();

      console.log(`[SMS Hub] Digital SMS Gateway Response Code: ${response.status}. Payload: ${logText}`);
      
      return { 
        success: response.ok, 
        response: logText, 
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
        gateway: 'Digital SMS Carrier Error' 
      };
    }
  }

  // 3. Fallback: Simulation Logging (when no live API gateways match)
  console.log(`[SMS Hub] [SIMULATION] Mobile dispatch target: ${mobileNumber}`);
  console.log(`[SMS Hub] [SIMULATION] Message: "${finalMessage}"`);
  return {
    success: true,
    simulated: true,
    messageBody: finalMessage,
    providerMessageId: `sim-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gateway: 'Simulation Mode - Configure SMS_API_KEY or DIGITALSMS_API_KEY to activate live gateways.'
  };
}
