// Types for the messaging integration layer

export type RiskLevel = 'low' | 'medium' | 'high';
export type Channel = 'sms' | 'whatsapp';
export type Provider = 'mock' | 'twilio';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type MessagePriority = 'low' | 'normal' | 'urgent';

export interface TaxpayerData {
  taxpayer_id: string;
  name?: string;
  phone?: string;
  ward: number;
  zone: number;
  tax_type: number;
  default_risk_probability: number;
  risk_category: string;
  due_amount?: number;
  arrears_amount?: number;
}

export interface MessagePayload {
  to: string; // taxpayer_id (anonymized identifier)
  message: string;
  channel: Channel;
  priority: MessagePriority;
  metadata?: Record<string, unknown>;
}

export interface GatewayResponse {
  success: boolean;
  messageId: string;
  status: MessageStatus;
  timestamp: string;
  error?: string;
}

export interface DecisionResult {
  channel: Channel;
  priority: MessagePriority;
  message: string;
  fallbackChannel?: Channel;
}

export interface NotificationResult {
  taxpayerId: string;
  channel: Channel;
  provider: Provider;
  status: MessageStatus;
  timestamp: string;
  messageId: string;
  error?: string;
}

export interface GatewayInterface {
  sendSMS(payload: MessagePayload): Promise<GatewayResponse>;
  sendWhatsApp(payload: MessagePayload): Promise<GatewayResponse>;
}
