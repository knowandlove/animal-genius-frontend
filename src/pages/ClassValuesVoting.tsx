import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Users, Vote, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { CORE_VALUE_CLUSTERS, type CoreValueCluster } from '@shared/core-values-constants';

interface VotingSession {
  id: string;
  classId: string;
  status: 'active' | 'completed' | 'expired';
  expiresAt: string;
  className?: string;
}

interface VoteSubmission {
  sessionId: string;
  votes: Array<{
    clusterNumber: number;
    values: Array<{ valueCode: string; rank: number }>;
  }>;
}

export default function ClassValuesVoting() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Authentication state
  const [passportCode, setPassportCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Voting state
  const [currentCluster, setCurrentCluster] = useState(1);
  const [votes, setVotes] = useState<Record<number, string[]>>({});
  const [isComplete, setIsComplete] = useState(false);

  // Get session info
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery<VotingSession>({
    queryKey: [`/api/class-values/session-by-id/${sessionId}`],
    queryFn: () => apiRequest('GET', `/api/class-values/session-by-id/${sessionId}`),
    enabled: !!sessionId,
    retry: 1
  });

  // Check if student has already voted
  const { data: hasVoted } = useQuery({
    queryKey: [`/api/class-values/check-voted/${sessionId}`, passportCode],
    queryFn: () => apiRequest('GET', `/api/class-values/check-voted/${sessionId}`, {
      headers: { 'X-Passport-Code': passportCode }
    }),
    enabled: !!sessionId && !!passportCode && isAuthenticated,
  });

  // Submit votes mutation
  const submitVotesMutation = useMutation({
    mutationFn: async (voteData: VoteSubmission) => {
      return apiRequest('POST', '/api/class-values/vote', voteData, {
        headers: { 'X-Passport-Code': passportCode }
      });
    },
    onSuccess: () => {
      setIsComplete(true);
      toast({
        title: "Votes Submitted!",
        description: "Thank you for helping choose your class values!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Submitting Votes",
        description: error.message || "Could not submit your votes. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle passport code authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportCode) return;

    setAuthLoading(true);
    try {
      // Validate passport code format (XXX-XXX)
      const passportRegex = /^[A-Z]{3}-[A-Z0-9]{3}$/;
      if (!passportRegex.test(passportCode.toUpperCase())) {
        throw new Error('Please enter a valid passport code (e.g., MEE-X7K)');
      }

      // Set passport code in uppercase and mark as authenticated
      const formattedCode = passportCode.toUpperCase();
      setPassportCode(formattedCode);
      setIsAuthenticated(true);
      
      toast({
        title: "Welcome!",
        description: "You can now participate in the class values voting.",
      });
    } catch (error: any) {
      toast({
        title: "Invalid Passport Code",
        description: error.message || "Please check your passport code and try again.",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle value selection for current cluster
  const handleValueSelect = (valueCode: string) => {
    const currentVotes = votes[currentCluster] || [];
    
    if (currentVotes.includes(valueCode)) {
      // Remove if already selected
      setVotes(prev => ({
        ...prev,
        [currentCluster]: currentVotes.filter(code => code !== valueCode)
      }));
    } else if (currentVotes.length < 3) {
      // Add if less than 3 selected
      setVotes(prev => ({
        ...prev,
        [currentCluster]: [...currentVotes, valueCode]
      }));
    } else {
      toast({
        title: "Maximum Reached",
        description: "You can only select 3 values per category.",
        variant: "destructive"
      });
    }
  };

  // Handle cluster completion
  const handleCompleteCluster = () => {
    const currentVotes = votes[currentCluster] || [];
    if (currentVotes.length !== 3) {
      toast({
        title: "Incomplete Selection",
        description: "Please select exactly 3 values before continuing.",
        variant: "destructive"
      });
      return;
    }

    if (currentCluster < 4) {
      setCurrentCluster(currentCluster + 1);
    } else {
      // Submit all votes - convert to backend format
      const votesForSubmission = Object.entries(votes).map(([clusterId, valueCodes]) => ({
        clusterNumber: parseInt(clusterId),
        values: valueCodes.map((valueCode, index) => ({
          valueCode,
          rank: index + 1 // 1st, 2nd, 3rd choice
        }))
      }));

      submitVotesMutation.mutate({
        sessionId: sessionId!,
        votes: votesForSubmission
      });
    }
  };

  const currentClusterData = CORE_VALUE_CLUSTERS.find(c => c.id === currentCluster);
  const currentVotes = votes[currentCluster] || [];
  const progressPercent = (Object.keys(votes).length / 4) * 100;

  // Loading states
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading voting session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="space-y-4">
              <div className="text-red-500">
                <Vote className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Session Not Found</h2>
              <p className="text-gray-600">
                This voting session may have expired or the link is invalid.
              </p>
              <p className="text-sm text-gray-500">
                Please ask your teacher for a new voting link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session expired
  if (session.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="space-y-4">
              <div className="text-yellow-500">
                <Vote className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Voting Closed</h2>
              <p className="text-gray-600">
                This voting session has ended. Thank you for your participation!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already voted
  if (hasVoted?.hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="space-y-4">
              <div className="text-green-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
              <p className="text-gray-600">
                You have already submitted your votes for this session.
              </p>
              <p className="text-sm text-gray-500">
                Your teacher will share the results when voting is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Voting complete
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="space-y-4">
              <div className="text-green-500">
                <Sparkles className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Votes Submitted!</h2>
              <p className="text-gray-600">
                Thank you for helping choose your class values! Your voice makes a difference.
              </p>
              <p className="text-sm text-gray-500">
                Wait for your teacher to reveal the results and create your class agreements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Passport authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Class Values Voting</CardTitle>
            <p className="text-center text-gray-600">
              Enter your passport code to participate
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <Label htmlFor="passportCode">Your Passport Code</Label>
                <Input
                  id="passportCode"
                  type="text"
                  placeholder="e.g., MEE-X7K"
                  value={passportCode}
                  onChange={(e) => setPassportCode(e.target.value)}
                  maxLength={7}
                  className="text-center text-lg font-mono"
                  disabled={authLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your passport code is on your animal personality card
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!passportCode || authLoading}
              >
                {authLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Join Voting'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main voting interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl">Help Choose Your Class Values!</CardTitle>
              <p className="text-gray-600">
                Select your top 3 values for: <strong>{currentClusterData?.title}</strong>
              </p>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="secondary">
                  Cluster {currentCluster} of 4
                </Badge>
                <Progress value={progressPercent} className="w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Voting Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-[#85B2C8]" />
              {currentClusterData?.title}
            </CardTitle>
            <p className="text-gray-600">{currentClusterData?.prompt}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Value Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentClusterData?.values.map((value) => {
                const isSelected = currentVotes.includes(value.code);
                const selectionIndex = currentVotes.indexOf(value.code);
                
                return (
                  <Card
                    key={value.code}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      isSelected 
                        ? 'border-[#85B2C8] bg-[#85B2C8]/10 shadow-md' 
                        : 'border-gray-200 hover:border-[#85B2C8]/50'
                    }`}
                    onClick={() => handleValueSelect(value.code)}
                  >
                    <CardContent className="p-4 text-center relative">
                      {isSelected && (
                        <Badge 
                          className="absolute -top-2 -right-2 bg-[#85B2C8] text-white"
                        >
                          {selectionIndex + 1}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-lg mb-2">{value.displayName}</h3>
                      <p className="text-sm text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selection Status */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-[#85B2C8]" />
                <span className="text-lg">
                  Selected: <strong>{currentVotes.length} of 3</strong>
                </span>
              </div>

              {/* Selected Values */}
              {currentVotes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {currentVotes.map((valueCode, index) => {
                    const value = currentClusterData?.values.find(v => v.code === valueCode);
                    return (
                      <Badge key={valueCode} variant="secondary" className="text-sm">
                        {index + 1}. {value?.displayName}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentCluster(Math.max(1, currentCluster - 1))}
                disabled={currentCluster === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleCompleteCluster}
                disabled={currentVotes.length !== 3 || submitVotesMutation.isPending}
                className="bg-[#85B2C8] hover:bg-[#6d94a6]"
              >
                {submitVotesMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : currentCluster === 4 ? (
                  'Submit All Votes'
                ) : (
                  <>
                    Next Cluster
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}