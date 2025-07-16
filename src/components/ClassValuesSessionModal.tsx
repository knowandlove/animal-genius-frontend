import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Link, Users, Timer, CheckCircle, BarChart } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';

interface ClassValuesSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSessionComplete: () => void;
}

interface SessionData {
  sessionId: string;
  votingUrl: string;
  qrCodeUrl: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'expired';
}

interface VotingProgress {
  session: {
    id: string;
    classId: string;
    status: string;
    expiresAt: string;
  };
  progress: {
    totalStudents: number;
    studentsVoted: number;
    completionPercentage: number;
  };
}

export function ClassValuesSessionModal({
  isOpen,
  onClose,
  classId,
  className,
  onSessionComplete
}: ClassValuesSessionModalProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showQR, setShowQR] = useState(true);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for existing active session
  const { data: existingSession, isLoading: checkingSession } = useQuery({
    queryKey: [`/api/classes/${classId}/lessons/4/activity/2/status`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/classes/${classId}/lessons/4/activity/2/status`);
      } catch (error) {
        console.log('No existing session found');
        return null;
      }
    },
    enabled: !!classId && isOpen
  });

  // Get voting progress if session exists
  const { data: votingProgress, isLoading: loadingProgress } = useQuery<VotingProgress>({
    queryKey: [`/api/class-values/progress/${sessionData?.sessionId}`],
    queryFn: () => apiRequest('GET', `/api/class-values/progress/${sessionData?.sessionId}`),
    enabled: !!sessionData?.sessionId,
    refetchInterval: 2000 // Poll every 2 seconds for live updates
  });

  // Extend session time mutation
  const extendTimeMutation = useMutation({
    mutationFn: async () => {
      // Extend session by another 15 minutes
      return await apiRequest('POST', `/api/class-values/extend-session/${sessionData?.sessionId}`);
    },
    onSuccess: (data) => {
      setSessionData(data);
      toast({
        title: "Session Extended!",
        description: "Voting session has been extended by 15 more minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Extending Session",
        description: "Could not extend the voting session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Reset session mutation (clears all votes and restarts)
  const resetSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/class-values/reset-session/${sessionData?.sessionId}`);
    },
    onSuccess: (data) => {
      setSessionData(prev => prev ? { ...prev, expiresAt: data.expiresAt } : null);
      // Invalidate progress to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/class-values/progress/${sessionData?.sessionId}`] });
      toast({
        title: "Session Reset!",
        description: "All votes have been cleared and the session has been restarted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Resetting Session",
        description: "Could not reset the voting session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Start voting session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/classes/${classId}/lessons/4/activity/2/start-voting`);
    },
    onSuccess: (data) => {
      setSessionData(data);
      toast({
        title: "Voting Session Started!",
        description: "Students can now join and vote on class values.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Starting Session",
        description: "Could not start the voting session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Finalize session mutation
  const finalizeSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/classes/${classId}/lessons/4/activity/2/complete`, {
        sessionId: sessionData?.sessionId
      });
    },
    onSuccess: async () => {
      toast({
        title: "Session Complete!",
        description: "Class values have been finalized and Activity 2 is now complete.",
      });
      onSessionComplete();
      onClose();
      
      // Wait a moment for database transaction to complete, then redirect
      setTimeout(() => {
        setLocation(`/class-values-results/${classId}`);
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error Finalizing Session",
        description: "Could not finalize the voting session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Load existing session data if available
  useEffect(() => {
    if (existingSession?.hasActiveSession) {
      setSessionData({
        sessionId: existingSession.sessionId,
        votingUrl: `${window.location.origin}/class-values-voting/${existingSession.sessionId}`,
        qrCodeUrl: '', // TODO: Generate QR code URL
        expiresAt: existingSession.expiresAt,
        status: 'active'
      });
    }
  }, [existingSession]);

  const handleStartSession = () => {
    startSessionMutation.mutate();
  };

  const handleFinalizeSession = () => {
    if (votingProgress && votingProgress.progress.studentsVoted < 1) {
      toast({
        title: "Cannot Finalize Yet",
        description: "At least one student must vote before finalizing the session.",
        variant: "destructive"
      });
      return;
    }
    finalizeSessionMutation.mutate();
  };

  const copyVotingUrl = () => {
    if (sessionData?.votingUrl) {
      navigator.clipboard.writeText(sessionData.votingUrl);
      toast({
        title: "URL Copied!",
        description: "The voting URL has been copied to your clipboard.",
      });
    }
  };

  if (checkingSession) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Class Values Voting Session</DialogTitle>
          <p className="text-gray-600">
            Help your students choose the core values that will become your classroom's roots.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {className || `Class ${classId}`}
              </CardTitle>
            </CardHeader>
          </Card>

          {!sessionData ? (
            /* Start Session Section */
            <Card>
              <CardHeader>
                <CardTitle>Ready to Start Voting?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Students will vote on their top 3 values in each of 4 clusters:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>How We Treat Each Other</li>
                  <li>How We Handle Challenges</li>
                  <li>How We Learn Together</li>
                  <li>How We Show Up Each Day</li>
                </ul>
                <Button 
                  onClick={handleStartSession}
                  disabled={startSessionMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  {startSessionMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Starting Session...
                    </>
                  ) : (
                    'Start Class Values Voting'
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Active Session Section */
            <>
              {/* Student Access */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {showQR ? <QrCode className="h-5 w-5" /> : <Link className="h-5 w-5" />}
                      Student Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showQR ? (
                      <div className="text-center">
                        <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-gray-500">
                            <QrCode className="h-16 w-16 mx-auto mb-2" />
                            <p className="text-sm">QR Code Coming Soon</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Share this URL with students:</p>
                        <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                          {sessionData.votingUrl}
                        </div>
                        <Button onClick={copyVotingUrl} variant="outline" size="sm">
                          Copy URL
                        </Button>
                      </div>
                    )}
                    <Button 
                      onClick={() => setShowQR(!showQR)} 
                      variant="outline" 
                      className="w-full"
                    >
                      {showQR ? 'Show URL Instead' : 'Show QR Code Instead'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Live Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Voting Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingProgress ? (
                      <div className="flex items-center justify-center p-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : votingProgress ? (
                      <>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-[#85B2C8]">
                            {votingProgress.progress.studentsVoted} / {votingProgress.progress.totalStudents}
                          </div>
                          <p className="text-sm text-gray-600">students have voted</p>
                        </div>
                        
                        <Progress 
                          value={votingProgress.progress.completionPercentage} 
                          className="w-full h-3"
                        />
                      </>
                    ) : (
                      <p className="text-gray-500 text-center">Loading progress...</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Session Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Session Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Session expires: {new Date(sessionData.expiresAt).toLocaleTimeString()}
                    </div>
                    <div className="space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => extendTimeMutation.mutate()}
                        disabled={extendTimeMutation.isPending}
                      >
                        {extendTimeMutation.isPending ? "Extending..." : "Extend Time"}
                      </Button>
                      <Button 
                        onClick={handleFinalizeSession}
                        disabled={finalizeSessionMutation.isPending || (votingProgress?.progress.studentsVoted || 0) < 1}
                        className="bg-[#829B79] hover:bg-[#6d8466]"
                      >
                        {finalizeSessionMutation.isPending ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Finalizing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Finalize & See Results
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Reset Section - Destructive Action */}
                  {(votingProgress?.progress.studentsVoted || 0) > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Need to start over? This will delete all votes and restart the session.
                        </p>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => resetSessionMutation.mutate()}
                          disabled={resetSessionMutation.isPending}
                        >
                          {resetSessionMutation.isPending ? "Resetting..." : "Reset All Votes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}