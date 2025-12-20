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

const nudgeTemplates: Record<RiskLevel, string> = {
  high: `URGENT NOTICE: Your tax payment is significantly overdue. Immediate action is required to avoid further penalties and legal proceedings. Please contact the tax office immediately.`,
  medium: `REMINDER: Your tax payment is overdue. Please clear your dues at the earliest to avoid additional penalties. Visit the tax office or pay online.`,
  low: `FRIENDLY REMINDER: Your tax payment is due soon. Please ensure timely payment to maintain your good standing. Thank you for your cooperation.`,
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
  const [message, setMessage] = useState(nudgeTemplates[riskLevel]);
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
        setMessage(nudgeTemplates[riskLevel]);
        onClose();
      }, 1000);
    }, 800);
  };

  const handleClose = () => {
    if (!isSending) {
      setIsSent(false);
      setMessage(nudgeTemplates[riskLevel]);
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
