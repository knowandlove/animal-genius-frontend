import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import Header from "@/components/header";
import { CoTeachersList, InviteCoTeacherModal, CollaboratorBadge } from "@/components/collaborators";
import { Settings, Users, ArrowLeft, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ClassData {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  iconEmoji?: string;
  iconColor?: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export default function ClassSettings() {
  const { classId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: classData, isLoading } = useQuery<ClassData>({
    queryKey: [`/api/classes/${classId}`],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(api(`/api/classes/${classId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch class data");
      }
      return response.json();
    },
    enabled: !!classId && !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading class settings...</div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Class Not Found
            </h2>
            <Button onClick={() => setLocation("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = classData.role === 'owner' || classData.teacherId === user?.id;
  const canManageCollaborators = isOwner;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(`/class/${classId}/analytics`)}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: classData.iconColor || "#c5d49f" }}
                >
                  {classData.iconEmoji || "📚"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {classData.name} - Settings
                    </h1>
                    {classData.role && (
                      <CollaboratorBadge role={classData.role} />
                    )}
                  </div>
                  <p className="text-gray-600">
                    Class Code: <span className="font-mono">{classData.code}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Co-Teachers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Class Name</h3>
                    <p className="text-lg">{classData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Class Code</h3>
                    <p className="text-lg font-mono">{classData.code}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Share Link</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {window.location.origin}/q/{classData.code}
                      </code>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/q/${classData.code}`);
                          toast({
                            title: "Link copied!",
                            description: "Quiz link has been copied to clipboard.",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaborators" className="space-y-4">
            {canManageCollaborators && (
              <div className="flex justify-end">
                <Button onClick={() => setInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Co-Teacher
                </Button>
              </div>
            )}
            
            <CoTeachersList 
              classId={classId!} 
              canManageCollaborators={canManageCollaborators}
            />

            {!canManageCollaborators && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 text-center">
                    Only the class owner can manage co-teachers.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Modal */}
      <InviteCoTeacherModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        classId={classId!}
        className={classData.name}
      />
    </div>
  );
}