// Twilio Gateway - Real SMS/WhatsApp delivery via Edge Function

import type { GatewayInterface, MessagePayload, GatewayResponse } from '../types';
import { supabase } from '@/integrations/supabase/client';

function generateMessageId(): string {
  return `twilio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function callTwilioEdgeFunction(
  to: string,
  message: string,
  channel: 'sms' | 'whatsapp'
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    console.log(`[TWILIO GATEWAY] Calling edge function for ${channel} to ${to}`);
    
    const { data, error } = await supabase.functions.invoke('send-twilio-message', {
      body: { to, message, channel },
    });

    if (error) {
      console.error('[TWILIO GATEWAY] Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Edge function call failed',
      };
    }

    if (!data.success) {
      console.error('[TWILIO GATEWAY] Twilio API error:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to send message',
      };
    }

    console.log(`[TWILIO GATEWAY] Message sent successfully. SID: ${data.sid}`);
    return {
      success: true,
      sid: data.sid,
    };
  } catch (error) {
    console.error('[TWILIO GATEWAY] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const twilioGateway: GatewayInterface = {
  async sendSMS(payload: MessagePayload): Promise<GatewayResponse> {
    const timestamp = new Date().toISOString();
    
    const result = await callTwilioEdgeFunction(payload.to, payload.message, 'sms');
    
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
  },

  async sendWhatsApp(payload: MessagePayload): Promise<GatewayResponse> {
    const timestamp = new Date().toISOString();
    
    const result = await callTwilioEdgeFunction(payload.to, payload.message, 'whatsapp');
    
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
  },
};

export default twilioGateway;
