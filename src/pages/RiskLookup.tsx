import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, Shield, AlertCircle, ArrowLeft, UserCircle } from 'lucide-react';
import { useLocalTaxpayers, LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { CitizenRiskCard } from '@/components/citizen/CitizenRiskCard';
import { AdminTaxpayerDetail } from '@/components/citizen/AdminTaxpayerDetail';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export default function RiskLookup() {
  const [searchId, setSearchId] = useState('');
  const [searchedTaxpayer, setSearchedTaxpayer] = useState<LocalTaxpayer | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: taxpayers } = useLocalTaxpayers();
  const { user } = useAuth();

  // Check if user is logged in (officer/admin)
  const isOfficer = !!user;

  const handleSearch = () => {
    const trimmedId = searchId.trim().toUpperCase();
    
    if (!trimmedId) {
      setSearchError('Please enter a Taxpayer ID');
      setSearchedTaxpayer(null);
      setHasSearched(true);
      return;
    }

    // Search with case-insensitive matching
    const found = taxpayers.find(
      (tp) => tp.taxpayer_id.toUpperCase() === trimmedId
    );

    if (found) {
      setSearchedTaxpayer(found);
      setSearchError(null);
    } else {
      setSearchedTaxpayer(null);
      setSearchError(`No taxpayer found with ID "${searchId}". Please check the ID and try again.`);
    }
    setHasSearched(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchId('');
    setSearchedTaxpayer(null);
    setSearchError(null);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Tax Risk Portal</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Risk Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isOfficer ? (
                <div className="flex items-center gap-2">
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="h-5 w-5" />
                    <span>Officer View</span>
                  </div>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Officer Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        {!searchedTaxpayer && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Check Your Tax Risk Status</h2>
              <p className="text-muted-foreground">
                Enter your Taxpayer ID to view your AI-calculated risk assessment
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Taxpayer ID Lookup
                </CardTitle>
                <CardDescription>
                  Enter your Taxpayer ID (e.g., TAX-100199) to view your risk profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter Taxpayer ID (e.g., TAX-100199)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchError && hasSearched && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Found</AlertTitle>
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Sample IDs for testing */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Sample IDs for testing:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {['TAX-133553', 'TAX-106113', 'TAX-100821'].map((id) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchId(id);
                      }}
                    >
                      {id}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Click any ID above to populate the search field
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {searchedTaxpayer && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset}>
                <Search className="h-4 w-4 mr-2" />
                Search Another ID
              </Button>
            </div>

            {isOfficer ? (
              // Admin/Officer View - Full Details
              <AdminTaxpayerDetail taxpayer={searchedTaxpayer} />
            ) : (
              // Citizen View - Limited Info
              <CitizenRiskCard
                taxpayerId={searchedTaxpayer.taxpayer_id}
                riskScore={searchedTaxpayer.default_risk_probability}
                riskLevel={searchedTaxpayer.riskLevel}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Risk assessment powered by AI • Data aligned with DPDP principles</p>
            <p className="mt-1">Only aggregated risk indicators are shown to protect sensitive financial data</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
