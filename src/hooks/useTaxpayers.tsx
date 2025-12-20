import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RiskLevel, TaxType, BehaviorSegment } from '@/types/taxpayer';

export interface TaxpayerWithRisk {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  ward: string;
  zone: string;
  propertyAddress: string;
  taxType: TaxType;
  riskScore: number;
  riskLevel: RiskLevel;
  behaviorSegment: BehaviorSegment;
  riskFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    weight: number;
    description: string;
  }>;
}

export function useTaxpayers() {
  return useQuery({
    queryKey: ['taxpayers-with-risk'],
    queryFn: async (): Promise<TaxpayerWithRisk[]> => {
      // Fetch taxpayers
      const { data: taxpayers, error: taxpayersError } = await supabase
        .from('taxpayers')
        .select('*')
        .order('created_at', { ascending: false });

      if (taxpayersError) throw taxpayersError;

      // Fetch the latest risk scores for each taxpayer
      const { data: riskScores, error: riskScoresError } = await supabase
        .from('risk_scores')
        .select('*')
        .order('calculated_at', { ascending: false });

      if (riskScoresError) throw riskScoresError;

      // Create a map of the latest risk score per taxpayer
      const latestRiskScores = new Map<string, typeof riskScores[0]>();
      riskScores?.forEach((score) => {
        if (!latestRiskScores.has(score.taxpayer_id)) {
          latestRiskScores.set(score.taxpayer_id, score);
        }
      });

      // Combine taxpayers with their risk scores
      return (taxpayers || []).map((taxpayer) => {
        const riskScore = latestRiskScores.get(taxpayer.id);
        
        return {
          id: taxpayer.id,
          name: taxpayer.name,
          phone: taxpayer.phone,
          email: taxpayer.email,
          ward: taxpayer.ward,
          zone: taxpayer.zone,
          propertyAddress: taxpayer.property_address,
          taxType: taxpayer.tax_type as TaxType,
          riskScore: riskScore?.risk_score ? Number(riskScore.risk_score) : 0,
          riskLevel: (riskScore?.risk_level || 'low') as RiskLevel,
          behaviorSegment: (riskScore?.behavior_segment || 'Regular Payer') as BehaviorSegment,
          riskFactors: Array.isArray(riskScore?.risk_factors) 
            ? (riskScore.risk_factors as Array<{
                factor: string;
                impact: 'positive' | 'negative';
                weight: number;
                description: string;
              }>)
            : [],
        };
      });
    },
  });
}

export interface DashboardStats {
  totalTaxpayers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get count of taxpayers
      const { count: totalTaxpayers, error: taxpayersError } = await supabase
        .from('taxpayers')
        .select('*', { count: 'exact', head: true });

      if (taxpayersError) throw taxpayersError;

      // Get risk score counts
      // First get unique taxpayers with their latest risk level
      const { data: riskScores, error: riskError } = await supabase
        .from('risk_scores')
        .select('taxpayer_id, risk_level, calculated_at')
        .order('calculated_at', { ascending: false });

      if (riskError) throw riskError;

      // Get latest risk level per taxpayer
      const latestRisks = new Map<string, string>();
      riskScores?.forEach((score) => {
        if (!latestRisks.has(score.taxpayer_id)) {
          latestRisks.set(score.taxpayer_id, score.risk_level);
        }
      });

      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;

      latestRisks.forEach((level) => {
        if (level === 'high') highRiskCount++;
        else if (level === 'medium') mediumRiskCount++;
        else lowRiskCount++;
      });

      return {
        totalTaxpayers: totalTaxpayers || 0,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
      };
    },
  });
}
