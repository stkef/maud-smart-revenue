import { useState } from 'react';
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
import { Send, CheckCircle } from 'lucide-react';
import { RiskLevel } from '@/hooks/useLocalTaxpayers';

interface LocalNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayerId: string;
  riskLevel: RiskLevel;
  onConfirm: () => void;
}

// Behavioral recommendations based on risk level
const nudgeTemplates: Record<RiskLevel, { title: string; message: string }> = {
  high: {
    title: 'Early Reminder & Follow-up',
    message: `URGENT NOTICE: Your tax payment is significantly overdue. Immediate action is required to avoid further penalties and legal proceedings. A follow-up visit from the revenue officer may be scheduled. Please contact the tax office immediately to discuss payment options.`,
  },
  medium: {
    title: 'Standard Deadline Reminder',
    message: `REMINDER: Your tax payment deadline is approaching. Please clear your dues at the earliest to avoid additional penalties. You can pay online or visit the tax office during working hours.`,
  },
  low: {
    title: 'Polite Informational Nudge',
    message: `FRIENDLY REMINDER: Your tax payment is due soon. Thank you for your consistent compliance. Please ensure timely payment to maintain your good standing with the municipality.`,
  },
};

const riskColors: Record<RiskLevel, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

export function LocalNudgeModal({
  isOpen,
  onClose,
  taxpayerId,
  riskLevel,
  onConfirm,
}: LocalNudgeModalProps) {
  const template = nudgeTemplates[riskLevel];
  const [message, setMessage] = useState(template.message);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleConfirm = () => {
    setIsSending(true);
    // Mock sending delay
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setTimeout(() => {
        onConfirm();
        setIsSent(false);
        setMessage(template.message);
        onClose();
      }, 1000);
    }, 800);
  };

  const handleClose = () => {
    if (!isSending) {
      setIsSent(false);
      setMessage(template.message);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Nudge
          </DialogTitle>
          <DialogDescription>
            Send a payment reminder to this taxpayer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Taxpayer ID</p>
              <p className="font-semibold">{taxpayerId}</p>
            </div>
            <Badge className={riskColors[riskLevel]}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Badge>
          </div>

          <div className="p-3 border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Behavioral Recommendation
            </p>
            <p className="text-sm font-medium text-primary">{template.title}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSending || isSent}
            />
          </div>
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
                <Send className="mr-2 h-4 w-4" />
                Send Nudge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
