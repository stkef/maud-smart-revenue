import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RiskLevel } from '@/types/taxpayer';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type NudgeType = Database['public']['Enums']['nudge_type'];

interface SendNudgeParams {
  taxpayerId: string;
  message: string;
  riskLevel: RiskLevel;
  nudgeType: NudgeType;
}

export function useSendNudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taxpayerId, message, riskLevel, nudgeType }: SendNudgeParams) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Insert nudge with pending status
      const { data, error } = await supabase
        .from('nudges')
        .insert({
          taxpayer_id: taxpayerId,
          message,
          risk_level: riskLevel,
          nudge_type: nudgeType,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate sending - update to 'sent' status
      const { error: updateError } = await supabase
        .from('nudges')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Nudge sent successfully',
        description: 'The taxpayer has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: ['nudges'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send nudge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export const nudgeTemplates = {
  high: {
    sms: "URGENT: Dear {name}, your property tax is critically overdue. Avoid legal action - pay immediately at maud.ap.gov.in or visit your ward office. Ref: {id}",
    whatsapp: "🚨 *URGENT NOTICE*\n\nDear {name},\n\nYour property tax payment is critically overdue.\n\n⚠️ To avoid:\n• Legal proceedings\n• Property seizure\n• Additional penalties\n\nPay immediately:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_",
    email: "Subject: URGENT - Property Tax Overdue Notice\n\nDear {name},\n\nThis is an urgent notice regarding your critically overdue property tax payment. Immediate action is required to avoid legal proceedings.\n\nPlease pay immediately at maud.ap.gov.in\n\nReference: {id}\n\nMA&UD Department"
  },
  medium: {
    sms: "Reminder: Dear {name}, your property tax payment is pending. Pay soon to avoid penalty. Visit maud.ap.gov.in. Ref: {id}",
    whatsapp: "📋 *Payment Reminder*\n\nDear {name},\n\nYour property tax payment is pending.\n\n💡 Pay now to:\n• Avoid additional penalties\n• Maintain good compliance record\n\nPay online:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_",
    email: "Subject: Property Tax Payment Reminder\n\nDear {name},\n\nThis is a friendly reminder that your property tax payment is pending. Please pay soon to avoid additional penalties.\n\nPay online at maud.ap.gov.in\n\nReference: {id}\n\nMA&UD Department"
  },
  low: {
    sms: "Thank you {name} for being a responsible taxpayer! Your upcoming tax payment is due soon. Continue your excellent record - pay at maud.ap.gov.in. Ref: {id}",
    whatsapp: "🌟 *Valued Taxpayer Appreciation*\n\nDear {name},\n\nThank you for your consistent tax compliance!\n\nYour upcoming payment is due soon.\n\n✨ Benefits of timely payment:\n• Early payment discounts\n• Priority service access\n\nPay online:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_",
    email: "Subject: Thank You - Upcoming Tax Payment Reminder\n\nDear {name},\n\nThank you for being a valued and responsible taxpayer! Your upcoming payment is due soon.\n\nContinue your excellent record by paying at maud.ap.gov.in\n\nReference: {id}\n\nMA&UD Department"
  }
};

export function getNudgeTemplate(
  riskLevel: RiskLevel, 
  nudgeType: NudgeType, 
  name: string, 
  id: string
): string {
  const template = nudgeTemplates[riskLevel][nudgeType];
  return template.replace(/{name}/g, name).replace(/{id}/g, id);
}
