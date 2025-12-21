import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, CheckCircle, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import { RiskLevel, LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { useMessagingIntegration } from '@/hooks/useMessagingIntegration';
import { makeDecision, type Channel } from '@/integrations/messaging';
import { toast } from 'sonner';

interface LocalNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayer: LocalTaxpayer;
  onSuccess?: () => void;
}

const riskColors: Record<RiskLevel, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

const channelIcons: Record<Channel, React.ReactNode> = {
  sms: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
};

export function LocalNudgeModal({
  isOpen,
  onClose,
  taxpayer,
  onSuccess,
}: LocalNudgeModalProps) {
  const { sendNudge, providerInfo } = useMessagingIntegration();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(taxpayer.phone || '');
  const [lastResult, setLastResult] = useState<{
    channel: Channel;
    provider: string;
    status: string;
    error?: string;
  } | null>(null);

  // Get decision from decision engine
  const decision = makeDecision({
    taxpayer_id: taxpayer.taxpayer_id,
    ward: taxpayer.ward,
    zone: taxpayer.zone,
    tax_type: taxpayer.tax_type,
    default_risk_probability: taxpayer.default_risk_probability,
    risk_category: taxpayer.risk_category,
    due_amount: taxpayer.due_amount,
    arrears_amount: taxpayer.arrears_amount,
  });

  const [message, setMessage] = useState(decision.message);
  const [channel, setChannel] = useState<Channel>(decision.channel);

  // Reset state when taxpayer changes
  useEffect(() => {
    setMessage(decision.message);
    setChannel(decision.channel);
    setPhoneNumber(taxpayer.phone || '');
    setIsSent(false);
    setLastResult(null);
  }, [taxpayer.taxpayer_id, decision.message, decision.channel, taxpayer.phone]);

  const handleConfirm = async () => {
    if (!phoneNumber) {
      toast.error('Phone number is required for Twilio');
      return;
    }

    setIsSending(true);
    try {
      // Create a modified taxpayer with the phone number
      const taxpayerWithPhone = { ...taxpayer, phone: phoneNumber };
      const result = await sendNudge(taxpayerWithPhone, message, channel);
      
      setLastResult({
        channel: result.channel,
        provider: result.provider,
        status: result.status,
        error: result.error,
      });

      if (result.status === 'sent' || result.status === 'delivered') {
        setIsSent(true);
        toast.success(`Nudge sent via ${result.channel.toUpperCase()} (${result.provider})`, {
          description: `Status: ${result.status}`,
        });
        
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        toast.error('Failed to send nudge', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to send nudge', { description: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setIsSent(false);
      setLastResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Nudge via Integration Layer
          </DialogTitle>
          <DialogDescription>
            Send a personalized payment reminder using the messaging integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Taxpayer Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Taxpayer ID</p>
              <p className="font-semibold">{taxpayer.taxpayer_id}</p>
            </div>
            <Badge className={riskColors[taxpayer.riskLevel]}>
              {taxpayer.riskLevel.charAt(0).toUpperCase() + taxpayer.riskLevel.slice(1)} Risk
            </Badge>
          </div>

          {/* Provider Info */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Provider:</span>
            <Badge variant="outline" className="font-mono">
              {providerInfo.provider.toUpperCase()}
            </Badge>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Priority:</span>
            <Badge variant={decision.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {decision.priority}
            </Badge>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              placeholder="+1234567890 (E.164 format)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSending || isSent}
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Enter the recipient's phone number in E.164 format (e.g., +919876543210 for India).
                {providerInfo.provider === 'twilio' && ' This will send a real message via Twilio.'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Communication Channel</label>
            <Select 
              value={channel} 
              onValueChange={(v) => setChannel(v as Channel)}
              disabled={isSending || isSent}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Recommended: {decision.channel.toUpperCase()} based on risk level
              {decision.fallbackChannel && ` (fallback: ${decision.fallbackChannel.toUpperCase()})`}
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSending || isSent}
            />
            <p className="text-xs text-muted-foreground">
              AI-generated based on risk profile. You can customize before sending.
            </p>
          </div>

          {/* Result Display */}
          {lastResult && (
            <div className={`p-3 rounded-lg border ${
              lastResult.status === 'sent' || lastResult.status === 'delivered'
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Delivery Status</span>
                <Badge variant={lastResult.status === 'sent' ? 'default' : 'destructive'}>
                  {lastResult.status}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                <div>Channel: <span className="font-mono">{lastResult.channel}</span></div>
                <div>Provider: <span className="font-mono">{lastResult.provider}</span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSending || isSent}>
            {isSent ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Sent!
              </>
            ) : isSending ? (
              'Sending...'
            ) : (
              <>
                {channelIcons[channel]}
                <span className="ml-2">Send via {channel.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
