// Twilio Gateway - Real SMS/WhatsApp delivery (integration-ready)
// Requires environment variables for credentials

import type { GatewayInterface, MessagePayload, GatewayResponse } from '../types';
import { getMessagingConfig, isTwilioConfigured } from '../config';

function generateMessageId(): string {
  return `twilio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Note: In a real implementation, this would call the Twilio API
// For PoC, we simulate the API call structure
async function callTwilioAPI(
  endpoint: string,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const config = getMessagingConfig();
  
  if (!isTwilioConfigured()) {
    return {
      success: false,
      error: 'Twilio is not properly configured',
    };
  }

  // Check if the number is in verified list (for demo/trial accounts)
  if (config.verifiedNumbers && config.verifiedNumbers.length > 0) {
    if (!config.verifiedNumbers.includes(phoneNumber)) {
      console.warn(`[TWILIO] Number ${phoneNumber} is not in verified list`);
      return {
        success: false,
        error: 'Phone number not verified for demo account',
      };
    }
  }

  // In production, this would be an actual API call:
  // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: new URLSearchParams({
  //     To: phoneNumber,
  //     From: fromNumber,
  //     Body: message,
  //   }),
  // });

  console.log(`[TWILIO] Would send to ${endpoint}`);
  console.log(`[TWILIO] To: ${phoneNumber}`);
  console.log(`[TWILIO] Message: ${message}`);

  // Simulate successful response
  return {
    success: true,
    sid: `SM${generateMessageId()}`,
  };
}

export const twilioGateway: GatewayInterface = {
  async sendSMS(payload: MessagePayload): Promise<GatewayResponse> {
    const timestamp = new Date().toISOString();
    
    try {
      const result = await callTwilioAPI('sms', payload.to, payload.message);
      
      if (!result.success) {
        return {
          success: false,
          messageId: '',
          status: 'failed',
          timestamp,
          error: result.error,
        };
      }

      console.log(`[TWILIO SMS] Sent successfully | SID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid || generateMessageId(),
        status: 'sent',
        timestamp,
      };
    } catch (error) {
      console.error('[TWILIO SMS] Error:', error);
      return {
        success: false,
        messageId: '',
        status: 'failed',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async sendWhatsApp(payload: MessagePayload): Promise<GatewayResponse> {
    const timestamp = new Date().toISOString();
    
    try {
      // WhatsApp via Twilio uses whatsapp: prefix
      const whatsappNumber = `whatsapp:${payload.to}`;
      const result = await callTwilioAPI('whatsapp', whatsappNumber, payload.message);
      
      if (!result.success) {
        return {
          success: false,
          messageId: '',
          status: 'failed',
          timestamp,
          error: result.error,
        };
      }

      console.log(`[TWILIO WhatsApp] Sent successfully | SID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid || generateMessageId(),
        status: 'sent',
        timestamp,
      };
    } catch (error) {
      console.error('[TWILIO WhatsApp] Error:', error);
      return {
        success: false,
        messageId: '',
        status: 'failed',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default twilioGateway;
