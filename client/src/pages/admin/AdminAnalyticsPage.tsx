import { BarChart3 } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export function AdminAnalyticsPage() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="Platform Metrics &amp; Governance"
        description="Geospatial distribution, active store density, and marketplace transaction telemetry"
      />

      <div className="space-y-6">
        <Alert variant="info">
          <BarChart3 className="h-4 w-4" />
          <AlertTitle>Phase 7 Milestone</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            Real-time geospatial analytics, order volume heatmaps, and platform governance reporting
            will be activated alongside the full transaction pipeline in Phase 7.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Performance</CardTitle>
            <CardDescription>Aggregate metrics across all delivery zones</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="Analytics Engine Inactive"
              description="Platform analytics will be connected after stores and order lifecycles are operational."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
