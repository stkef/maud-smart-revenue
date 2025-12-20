// Mock Gateway - Simulates message sending for PoC/testing

import type { GatewayInterface, MessagePayload, GatewayResponse } from '../types';

function generateMessageId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function simulateDelay(): Promise<void> {
  // Simulate network latency (100-500ms)
  const delay = Math.floor(Math.random() * 400) + 100;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export const mockGateway: GatewayInterface = {
  async sendSMS(payload: MessagePayload): Promise<GatewayResponse> {
    await simulateDelay();
    
    const messageId = generateMessageId();
    const timestamp = new Date().toISOString();
    
    // Log the message (simulating send)
    console.log(`[MOCK SMS] To: ${payload.to}`);
    console.log(`[MOCK SMS] Priority: ${payload.priority}`);
    console.log(`[MOCK SMS] Message: ${payload.message}`);
    console.log(`[MOCK SMS] Status: SENT | ID: ${messageId}`);
    
    return {
      success: true,
      messageId,
      status: 'sent',
      timestamp,
    };
  },

  async sendWhatsApp(payload: MessagePayload): Promise<GatewayResponse> {
    await simulateDelay();
    
    const messageId = generateMessageId();
    const timestamp = new Date().toISOString();
    
    // Log the message (simulating send)
    console.log(`[MOCK WhatsApp] To: ${payload.to}`);
    console.log(`[MOCK WhatsApp] Priority: ${payload.priority}`);
    console.log(`[MOCK WhatsApp] Message: ${payload.message}`);
    console.log(`[MOCK WhatsApp] Status: SENT | ID: ${messageId}`);
    
    return {
      success: true,
      messageId,
      status: 'sent',
      timestamp,
    };
  },
};

export default mockGateway;
