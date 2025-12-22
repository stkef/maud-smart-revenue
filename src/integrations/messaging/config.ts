// Configuration for the messaging integration layer

export interface MessagingConfig {
  useTwilio: boolean;
  testPhoneNumber: string | null; // Test number to send all messages to (for development)
}

// Default configuration - use Twilio when secrets are configured
const defaultConfig: MessagingConfig = {
  useTwilio: true, // Enable Twilio by default (will check if secrets exist via edge function)
  testPhoneNumber: '9346572761', // All messages will be sent to this number
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

// Get the test phone number if configured
export function getTestPhoneNumber(): string | null {
  return currentConfig.testPhoneNumber;
}
