import { useState } from 'react';
import { Taxpayer, RiskLevel } from '@/types/taxpayer';
import { nudgeTemplates } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Phone, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NudgePreviewProps {
  taxpayer: Taxpayer;
}

export function NudgePreview({ taxpayer }: NudgePreviewProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<'sms' | 'whatsapp' | null>(null);

  const templates = nudgeTemplates[taxpayer.riskLevel];

  const formatMessage = (template: string) => {
    return template
      .replace('{name}', taxpayer.name)
      .replace('{amount}', `₹${taxpayer.totalDue.toLocaleString('en-IN')}`)
      .replace('{days}', String(taxpayer.delayDays))
      .replace('{id}', taxpayer.id);
  };

  const handleSendNudge = async (type: 'sms' | 'whatsapp') => {
    setSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setSent(type);
    toast.success(`${type === 'sms' ? 'SMS' : 'WhatsApp'} reminder sent successfully!`, {
      description: `Sent to ${taxpayer.phone}`,
    });
    setTimeout(() => setSent(null), 3000);
  };

  const urgencyLabels: Record<RiskLevel, { text: string; class: string }> = {
    high: { text: 'URGENT ACTION REQUIRED', class: 'bg-destructive/10 text-destructive' },
    medium: { text: 'GENTLE REMINDER', class: 'bg-warning/10 text-warning' },
    low: { text: 'APPRECIATION MESSAGE', class: 'bg-success/10 text-success' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
            urgencyLabels[taxpayer.riskLevel].class
          )}
        >
          {urgencyLabels[taxpayer.riskLevel].text}
        </span>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Phone className="h-4 w-4" />
            SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <div className="rounded-lg bg-[#dcf8c6] p-4 font-sans text-sm shadow-sm">
            <pre className="whitespace-pre-wrap text-gray-800 font-sans">
              {formatMessage(templates.whatsapp)}
            </pre>
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => handleSendNudge('whatsapp')}
            disabled={sending || sent === 'whatsapp'}
          >
            {sent === 'whatsapp' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Sent Successfully
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send WhatsApp Reminder'}
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            {formatMessage(templates.sms)}
          </div>
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={() => handleSendNudge('sms')}
            disabled={sending || sent === 'sms'}
          >
            {sent === 'sms' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Sent Successfully
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send SMS Reminder'}
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
