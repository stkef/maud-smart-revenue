import { RiskBadge } from '@/components/RiskBadge';
import { RiskScoreGauge } from '@/components/RiskScoreGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CreditCard,
  Building,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { LocalTaxpayer, TAX_TYPE_MAP, PROPERTY_TYPE_MAP, USAGE_CATEGORY_MAP, PAYMENT_MODE_MAP } from '@/hooks/useLocalTaxpayers';

interface AdminTaxpayerDetailProps {
  taxpayer: LocalTaxpayer;
}

export function AdminTaxpayerDetail({ taxpayer }: AdminTaxpayerDetailProps) {
  const riskPercentage = Math.round(taxpayer.default_risk_probability * 100);
  const consistencyScore = Math.max(0, 100 - (taxpayer.delay_days * 2));
  
  // Determine delay severity
  const getDelaySeverity = (days: number) => {
    if (days === 0) return { label: 'On Time', color: 'bg-success text-success-foreground' };
    if (days <= 10) return { label: 'Minor Delay', color: 'bg-warning text-warning-foreground' };
    if (days <= 30) return { label: 'Moderate Delay', color: 'bg-orange-500 text-white' };
    return { label: 'Severe Delay', color: 'bg-destructive text-destructive-foreground' };
  };

  const delaySeverity = getDelaySeverity(taxpayer.delay_days);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Taxpayer Profile
              </CardTitle>
              <p className="text-muted-foreground mt-1">ID: {taxpayer.taxpayer_id}</p>
            </div>
            <RiskBadge level={taxpayer.riskLevel} size="lg" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Assessment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <RiskScoreGauge score={taxpayer.default_risk_probability} level={taxpayer.riskLevel} size="md" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risk Probability</span>
                <span className="font-medium">{riskPercentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risk Category</span>
                <span className="font-medium capitalize">{taxpayer.risk_category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Default Label</span>
                <Badge variant={taxpayer.default_risk_label === 1 ? 'destructive' : 'secondary'}>
                  {taxpayer.default_risk_label === 1 ? 'Defaulter' : 'Non-Defaulter'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Ward
              </span>
              <span className="font-medium">Ward {taxpayer.ward}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Zone</span>
              <span className="font-medium">Zone {taxpayer.zone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Property Type</span>
              <Badge variant="outline">{PROPERTY_TYPE_MAP[taxpayer.property_type] || 'Unknown'}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage Category</span>
              <Badge variant="outline">{USAGE_CATEGORY_MAP[taxpayer.usage_category] || 'Unknown'}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax Type</span>
              <Badge variant="outline">{TAX_TYPE_MAP[taxpayer.tax_type] || 'Unknown'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Amount</span>
              <span className={`font-medium ${taxpayer.due_amount > 0 ? 'text-destructive' : 'text-success'}`}>
                ₹{Math.abs(taxpayer.due_amount * 10000).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Arrears Amount</span>
              <span className={`font-medium ${taxpayer.arrears_amount > 0 ? 'text-destructive' : 'text-success'}`}>
                ₹{Math.abs(taxpayer.arrears_amount * 10000).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Penalty Amount</span>
              <span className={`font-medium ${taxpayer.penalty_amount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                ₹{Math.abs(taxpayer.penalty_amount * 1000).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Mode</span>
              <Badge variant="secondary">{PAYMENT_MODE_MAP[taxpayer.payment_mode] || 'Unknown'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Behavior Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Payment Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Due Date
                </span>
                <span className="font-medium">{new Date(taxpayer.due_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium">{new Date(taxpayer.payment_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Delay Days
                </span>
                <Badge className={delaySeverity.color}>{taxpayer.delay_days} days</Badge>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${delaySeverity.color}`}>
                {delaySeverity.label}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Consistency</span>
                <span className="font-medium">{consistencyScore}%</span>
              </div>
              <Progress value={consistencyScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
