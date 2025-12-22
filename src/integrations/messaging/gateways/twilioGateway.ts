// Twilio Gateway - Real SMS/WhatsApp delivery via Edge Function
// Falls back gracefully to mock behavior if Twilio is not configured

import type { GatewayInterface, MessagePayload, GatewayResponse } from '../types';
import { supabase } from '@/integrations/supabase/client';

function generateMessageId(): string {
  return `twilio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMockMessageId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock fallback when Twilio is not configured - DISABLED for debugging
function createMockResponse(channel: 'sms' | 'whatsapp', to: string, message: string): GatewayResponse {
  console.warn(`[TWILIO GATEWAY] Mock fallback DISABLED - returning error for ${channel.toUpperCase()} | To: ${to}`);
  return {
    success: false,
    messageId: '',
    status: 'failed',
    timestamp: new Date().toISOString(),
    error: 'Twilio not configured - mock fallback disabled for debugging',
  };
}

async function callTwilioEdgeFunction(
  to: string,
  message: string,
  channel: 'sms' | 'whatsapp'
): Promise<{ success: boolean; sid?: string; error?: string; notConfigured?: boolean; whatsappNotEnabled?: boolean }> {
  try {
    console.log(`[TWILIO GATEWAY] Calling edge function for ${channel} to ${to}`);
    
    const { data, error } = await supabase.functions.invoke('send-twilio-message', {
      body: { to, message, channel },
    });

    if (error) {
      console.error('[TWILIO GATEWAY] Edge function error:', error);
      if (error.message?.includes('credentials') || error.message?.includes('not configured')) {
        return { success: false, notConfigured: true, error: error.message };
      }
      return { success: false, error: error.message || 'Edge function call failed' };
    }

    if (!data.success) {
      console.error('[TWILIO GATEWAY] Twilio API error:', data.error);
      // Check for WhatsApp channel not enabled error (63007)
      if (data.code === 63007 || data.error?.includes('Channel with the specified From address')) {
        console.log('[TWILIO GATEWAY] WhatsApp not enabled for this number, will fall back to SMS');
        return { success: false, whatsappNotEnabled: true, error: data.error };
      }
      if (data.error?.includes('credentials') || data.error?.includes('not configured')) {
        return { success: false, notConfigured: true, error: data.error };
      }
      return { success: false, error: data.error || 'Failed to send message' };
    }

    console.log(`[TWILIO GATEWAY] Message sent successfully. SID: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('[TWILIO GATEWAY] Unexpected error:', error);
    return { 
      success: false, 
      notConfigured: true,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export const twilioGateway: GatewayInterface = {
  async sendSMS(payload: MessagePayload): Promise<GatewayResponse> {
    const timestamp = new Date().toISOString();
    
    const result = await callTwilioEdgeFunction(payload.to, payload.message, 'sms');
    
    // Fall back to mock if Twilio is not configured
    if (result.notConfigured) {
      console.log('[TWILIO GATEWAY] Twilio not configured, using mock fallback');
      return createMockResponse('sms', payload.to, payload.message);
    }
    
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
    
    // Fall back to mock if Twilio is not configured
    if (result.notConfigured) {
      console.log('[TWILIO GATEWAY] Twilio not configured, using mock fallback');
      return createMockResponse('whatsapp', payload.to, payload.message);
    }
    
    // If WhatsApp not enabled for this number, automatically fall back to SMS
    if (result.whatsappNotEnabled) {
      console.log('[TWILIO GATEWAY] WhatsApp not enabled, falling back to SMS');
      const smsResult = await callTwilioEdgeFunction(payload.to, payload.message, 'sms');
      
      if (smsResult.success) {
        console.log(`[TWILIO SMS FALLBACK] Sent successfully | SID: ${smsResult.sid}`);
        return {
          success: true,
          messageId: smsResult.sid || generateMessageId(),
          status: 'sent',
          timestamp,
        };
      }
      
      // If SMS also fails, return the error
      return {
        success: false,
        messageId: '',
        status: 'failed',
        timestamp,
        error: smsResult.error || 'SMS fallback failed',
      };
    }
    
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
