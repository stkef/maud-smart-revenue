import { useState } from 'react';
import { TaxpayerWithRisk } from '@/hooks/useTaxpayers';
import { useSendNudge, getNudgeTemplate } from '@/hooks/useNudges';
import { RiskBadge } from './RiskBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type NudgeType = Database['public']['Enums']['nudge_type'];

interface SendNudgeModalProps {
  taxpayer: TaxpayerWithRisk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNudgeModal({ taxpayer, open, onOpenChange }: SendNudgeModalProps) {
  const [nudgeType, setNudgeType] = useState<NudgeType>('sms');
  const [message, setMessage] = useState('');
  const { mutate: sendNudge, isPending } = useSendNudge();

  // Update message when taxpayer or nudge type changes
  const updateMessage = (type: NudgeType) => {
    if (taxpayer) {
      setMessage(getNudgeTemplate(taxpayer.riskLevel, type, taxpayer.name, taxpayer.id));
    }
  };

  // Initialize message when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && taxpayer) {
      updateMessage(nudgeType);
    }
    onOpenChange(isOpen);
  };

  const handleNudgeTypeChange = (type: NudgeType) => {
    setNudgeType(type);
    updateMessage(type);
  };

  const handleSend = () => {
    if (!taxpayer) return;
    
    sendNudge({
      taxpayerId: taxpayer.id,
      message,
      riskLevel: taxpayer.riskLevel,
      nudgeType,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setMessage('');
        setNudgeType('sms');
      },
    });
  };

  if (!taxpayer) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Nudge
          </DialogTitle>
          <DialogDescription>
            Send a payment reminder to this taxpayer based on their risk level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Taxpayer Details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{taxpayer.name}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{taxpayer.id}</p>
                </div>
              </div>
              <RiskBadge level={taxpayer.riskLevel} size="md" />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{taxpayer.ward}, {taxpayer.zone}</span>
              </div>
              {taxpayer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{taxpayer.phone}</span>
                </div>
              )}
              {taxpayer.email && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{taxpayer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nudge Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="nudge-type">Notification Channel</Label>
            <Select value={nudgeType} onValueChange={(v) => handleNudgeTypeChange(v as NudgeType)}>
              <SelectTrigger id="nudge-type">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (can be edited)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending || !message.trim()}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
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
