import { RiskBadge } from '@/components/RiskBadge';
import { RiskScoreGauge } from '@/components/RiskScoreGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { RiskLevel } from '@/types/taxpayer';

interface CitizenRiskCardProps {
  taxpayerId: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

export function CitizenRiskCard({ taxpayerId, riskScore, riskLevel }: CitizenRiskCardProps) {
  const riskMessages = {
    low: "Great news! Your payment history indicates a low risk of default. Keep up the good work with timely payments.",
    medium: "Your risk level is moderate. Consider making payments on time to improve your standing.",
    high: "Your account shows high risk indicators. We recommend clearing any arrears and making timely payments to avoid penalties."
  };

  return (
    <Card className="w-full max-w-md mx-auto border-2 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Your Risk Assessment</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Taxpayer ID: {taxpayerId}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <RiskScoreGauge score={riskScore} level={riskLevel} size="lg" />
        </div>
        
        <div className="flex justify-center">
          <RiskBadge level={riskLevel} size="lg" />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">What does this mean?</p>
              <p className="text-sm text-muted-foreground mt-1">
                {riskMessages[riskLevel]}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Risk is calculated using AI based on payment history, delays, and consistency patterns.
        </p>
      </CardContent>
    </Card>
  );
}
