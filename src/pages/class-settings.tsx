import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { Settings, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";

interface ClassData {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  iconEmoji?: string;
  iconColor?: string;
  icon?: string; // Backend returns this instead of iconEmoji
  backgroundColor?: string; // Backend returns this instead of iconColor
}

export default function ClassSettings() {
  const { classId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    setLocation("/");
  };

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
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        className={undefined}
        classCode={undefined}
        user={user || undefined}
        onLogout={handleLogout}
      >
        <div className="text-center py-16">Loading class settings...</div>
      </AuthenticatedLayout>
    );
  }

  if (!classData) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user || undefined}
        onLogout={handleLogout}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Class Not Found
          </h2>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId}
      className={classData.name}
      classCode={classData.code}
      user={user || undefined}
      onLogout={handleLogout}
    >
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: getIconColor(classData.iconColor, classData.backgroundColor) }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(classData.icon || classData.iconEmoji);
                    return <IconComponent className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {classData.name} - Settings
                    </h1>
                  </div>
                  <p className="text-gray-600">
                    Class Code: <span className="font-mono">{classData.code}</span>
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
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


        </Tabs>

    </AuthenticatedLayout>
  );
}