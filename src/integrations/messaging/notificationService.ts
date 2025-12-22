// Notification Orchestrator - Central integration entry point

import type { 
  TaxpayerData, 
  NotificationResult, 
  MessagePayload,
  GatewayInterface,
  Channel,
  Provider,
} from './types';
import { makeDecision } from './decisionEngine';
import { mockGateway } from './gateways/mockGateway';
import { twilioGateway } from './gateways/twilioGateway';
import { getMessagingConfig, isTwilioConfigured } from './config';

/**
 * Get the appropriate gateway based on configuration
 */
function getGateway(): { gateway: GatewayInterface; provider: Provider } {
  const config = getMessagingConfig();
  
  if (config.useTwilio && isTwilioConfigured()) {
    return { gateway: twilioGateway, provider: 'twilio' };
  }
  
  return { gateway: mockGateway, provider: 'mock' };
}

/**
 * Send a notification to a single taxpayer
 * @param taxpayer - Taxpayer data with risk information
 * @param customMessage - Optional custom message override
 * @param forceChannel - Optional channel override
 */
export async function sendNotification(
  taxpayer: TaxpayerData,
  customMessage?: string,
  forceChannel?: Channel
): Promise<NotificationResult> {
  const decision = makeDecision(taxpayer);
  const { gateway, provider } = getGateway();
  
  const channel = forceChannel || decision.channel;
  const message = customMessage || decision.message;
  
  // Use test phone number from env if configured, otherwise use taxpayer's phone
  const testPhone = import.meta.env.VITE_TEST_PHONE_NUMBER;
  const phoneNumber = testPhone || taxpayer.phone || taxpayer.taxpayer_id;
  
  const payload: MessagePayload = {
    to: phoneNumber,
    message,
    channel,
    priority: decision.priority,
    metadata: {
      taxpayerId: taxpayer.taxpayer_id,
      ward: taxpayer.ward,
      zone: taxpayer.zone,
      riskCategory: taxpayer.risk_category,
    },
  };

  try {
    const response = channel === 'whatsapp' 
      ? await gateway.sendWhatsApp(payload)
      : await gateway.sendSMS(payload);

    // If WhatsApp fails and we have a fallback, try SMS
    if (!response.success && decision.fallbackChannel && channel === 'whatsapp') {
      console.log(`[ORCHESTRATOR] WhatsApp failed, trying SMS fallback`);
      const fallbackPayload = { ...payload, channel: 'sms' as Channel };
      const fallbackResponse = await gateway.sendSMS(fallbackPayload);
      
      return {
        taxpayerId: taxpayer.taxpayer_id,
        channel: 'sms',
        provider,
        status: fallbackResponse.status,
        timestamp: fallbackResponse.timestamp,
        messageId: fallbackResponse.messageId,
        message,
        error: fallbackResponse.error,
      };
    }

    return {
      taxpayerId: taxpayer.taxpayer_id,
      channel,
      provider,
      status: response.status,
      timestamp: response.timestamp,
      messageId: response.messageId,
      message,
      error: response.error,
    };
  } catch (error) {
    console.error('[ORCHESTRATOR] Error sending notification:', error);
    return {
      taxpayerId: taxpayer.taxpayer_id,
      channel,
      provider,
      status: 'failed',
      timestamp: new Date().toISOString(),
      messageId: '',
      message,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notifications to multiple taxpayers
 * @param taxpayers - Array of taxpayer data
 * @param onProgress - Optional callback for progress updates
 */
export async function sendBatchNotifications(
  taxpayers: TaxpayerData[],
  onProgress?: (completed: number, total: number, result: NotificationResult) => void
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  
  for (let i = 0; i < taxpayers.length; i++) {
    const result = await sendNotification(taxpayers[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, taxpayers.length, result);
    }
  }
  
  return results;
}

/**
 * Send notifications only to high-risk taxpayers
 */
export async function sendHighRiskNotifications(
  taxpayers: TaxpayerData[],
  onProgress?: (completed: number, total: number, result: NotificationResult) => void
): Promise<NotificationResult[]> {
  const highRisk = taxpayers.filter(tp => tp.default_risk_probability > 0.6);
  return sendBatchNotifications(highRisk, onProgress);
}

/**
 * Get provider information
 */
export function getProviderInfo(): { provider: Provider; isConfigured: boolean } {
  const config = getMessagingConfig();
  return {
    provider: config.useTwilio && isTwilioConfigured() ? 'twilio' : 'mock',
    isConfigured: config.useTwilio ? isTwilioConfigured() : true,
  };
}
