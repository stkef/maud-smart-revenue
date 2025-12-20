// Configuration for the messaging integration layer

export interface MessagingConfig {
  useTwilio: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWhatsAppNumber?: string;
  verifiedNumbers?: string[];
}

// Default configuration - uses mock gateway
const defaultConfig: MessagingConfig = {
  useTwilio: false,
  verifiedNumbers: [],
};

let currentConfig: MessagingConfig = { ...defaultConfig };

export function getMessagingConfig(): MessagingConfig {
  return { ...currentConfig };
}

export function setMessagingConfig(config: Partial<MessagingConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function resetMessagingConfig(): void {
  currentConfig = { ...defaultConfig };
}

// Check if Twilio is properly configured
export function isTwilioConfigured(): boolean {
  const config = getMessagingConfig();
  return !!(
    config.useTwilio &&
    config.twilioAccountSid &&
    config.twilioAuthToken &&
    config.twilioPhoneNumber
  );
}
