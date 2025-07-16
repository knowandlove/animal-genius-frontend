import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Users, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { CORE_VALUE_CLUSTERS } from '@shared/core-values-constants';

interface ClassValuesResultsData {
  className: string;
  valuesSetAt: string;
  values: Array<{
    clusterId: number;
    clusterTitle: string;
    clusterPrompt: string;
    values: Array<{
      code: string;
      name: string;
    }>;
  }>;
}

export default function ClassValuesResults() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch class values results
  const { data: resultsData, isLoading, error } = useQuery<ClassValuesResultsData>({
    queryKey: [`/api/class-values/results/${classId}`],
    queryFn: async () => {
      console.log('🔍 Fetching results for classId:', classId);
      try {
        const result = await apiRequest('GET', `/api/class-values/results/${classId}`);
        console.log('✅ Results received:', result);
        return result;
      } catch (err) {
        console.error('❌ Error fetching results:', err);
        throw err;
      }
    },
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading class values results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !resultsData) {
    console.log('❌ Error or no results data:', { error, resultsData, classId });
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="space-y-4">
              <div className="text-red-500">
                <Trophy className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Results Not Found</h2>
              <p className="text-gray-600">
                Class values haven't been set yet or there was an error loading the results.
              </p>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Debug: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Class ID: {classId}
              </p>
              <Button onClick={handleBackToLearningLounge}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Learning Lounge
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Values are already grouped by cluster in the backend response

  const handleBackToLearningLounge = () => {
    setLocation(`/learning-lounge?classId=${classId}&module=week-of-connection&lesson=4`);
  };

  const handlePrintResults = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-[#85B2C8]" />
                  Our Class Values
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  <strong>{resultsData.className}</strong> - Set on {new Date(resultsData.valuesSetAt).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-3">
                <Button variant="outline" onClick={handlePrintResults}>
                  Print Results
                </Button>
                <Button onClick={handleBackToLearningLounge}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Learning Lounge
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Success Message */}
        <Card className="mb-6">
          <CardContent className="text-center p-6">
            <div className="space-y-4">
              <div className="text-green-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Values Successfully Chosen!</h2>
              <p className="text-gray-600">
                Your class has democratically selected the core values that will guide your classroom community.
                These values reflect what's important to your students and will help create a positive learning environment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results by Cluster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resultsData.values.map((cluster) => (
            <Card key={cluster.clusterId} className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#85B2C8]" />
                  {cluster.clusterTitle}
                </CardTitle>
                <p className="text-sm text-gray-600">{cluster.clusterPrompt}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cluster.values.length > 0 ? (
                    cluster.values.map((value, index) => {
                      const fullValueInfo = CORE_VALUE_CLUSTERS.find(c => c.id === cluster.clusterId)?.values.find(v => v.code === value.code);
                      
                      return (
                        <div
                          key={value.code}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-[#85B2C8]/10 to-[#85B2C8]/5 rounded-lg border border-[#85B2C8]/20"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className="bg-[#85B2C8] text-white">
                              #{index + 1}
                            </Badge>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {value.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {fullValueInfo?.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-[#85B2C8]">
                              Selected
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No values selected for this category
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Implementation Suggestions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#85B2C8]" />
              Next Steps: Living Your Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Create Class Agreements</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Turn these values into specific classroom behaviors</li>
                  <li>• Have students suggest concrete examples</li>
                  <li>• Post agreements visibly in the classroom</li>
                  <li>• Refer back to them when resolving conflicts</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Reinforce Throughout the Year</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Recognize students living these values</li>
                  <li>• Use values in curriculum discussions</li>
                  <li>• Revisit and reflect on values monthly</li>
                  <li>• Connect values to literature and history</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}