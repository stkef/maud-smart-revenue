// Configuration for the messaging integration layer

export interface MessagingConfig {
  useTwilio: boolean;
}

// Default configuration - use Twilio when secrets are configured
const defaultConfig: MessagingConfig = {
  useTwilio: true, // Enable Twilio by default (will check if secrets exist via edge function)
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

// Check if Twilio is configured (always returns true now since edge function handles validation)
export function isTwilioConfigured(): boolean {
  return currentConfig.useTwilio;
}
