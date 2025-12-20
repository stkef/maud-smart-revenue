import { useState } from 'react';
import { TaxpayerWithRisk } from '@/hooks/useTaxpayers';
import { RiskBadge } from './RiskBadge';
import { RiskScoreGauge } from './RiskScoreGauge';
import { RiskFactorsList } from './RiskFactorsList';
import { SendNudgeModal } from './SendNudgeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Building,
  User,
  TrendingUp,
  MessageSquare,
  Send,
} from 'lucide-react';

interface TaxpayerProfileLiveProps {
  taxpayer: TaxpayerWithRisk;
  onClose: () => void;
}

export function TaxpayerProfileLive({ taxpayer, onClose }: TaxpayerProfileLiveProps) {
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-card shadow-xl animate-slide-up border-l">
          {/* Header */}
          <div className="sticky top-0 z-10 gradient-primary p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary-foreground">
                      {taxpayer.name}
                    </h2>
                    <p className="text-sm text-primary-foreground/80 font-mono">
                      {taxpayer.id}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-primary-foreground/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{taxpayer.ward}, {taxpayer.zone} Zone</span>
              </div>
              {taxpayer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{taxpayer.phone}</span>
                </div>
              )}
              {taxpayer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{taxpayer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{taxpayer.taxType}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Risk Score & Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AI Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  <RiskScoreGauge
                    score={taxpayer.riskScore}
                    level={taxpayer.riskLevel}
                    size="md"
                  />
                  <RiskBadge level={taxpayer.riskLevel} size="lg" className="mt-4" />
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {taxpayer.behaviorSegment}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <span className="font-medium text-right text-sm">{taxpayer.propertyAddress}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ward</span>
                    <span className="font-semibold">{taxpayer.ward}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Zone</span>
                    <span className="font-semibold">{taxpayer.zone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tax Type</span>
                    <span className="font-semibold">{taxpayer.taxType}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            {taxpayer.riskFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    AI Risk Analysis Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskFactorsList factors={taxpayer.riskFactors} />
                </CardContent>
              </Card>
            )}

            {/* Send Nudge Action */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Send Payment Reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Send a personalized payment reminder to this taxpayer based on their risk level.
                </p>
                <Button onClick={() => setNudgeModalOpen(true)} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Nudge
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Nudge Modal */}
      <SendNudgeModal
        taxpayer={taxpayer}
        open={nudgeModalOpen}
        onOpenChange={setNudgeModalOpen}
      />
    </>
  );
}
