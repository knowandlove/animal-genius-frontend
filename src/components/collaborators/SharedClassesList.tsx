import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { CollaboratorBadge } from "./CollaboratorBadge";
import { useLocation } from "wouter";
import { Users, CalendarDays, Clipboard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { CollaboratorClassInfo } from "@/types/collaborators";

export function SharedClassesList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: response, isLoading } = useQuery<{ classes: CollaboratorClassInfo[] }>({
    queryKey: ["/api/my-collaborations"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/my-collaborations");
    },
  });

  const sharedClasses = response?.classes || [];

  const copyClassLink = (code: string) => {
    const url = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Quiz link has been copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shared Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            Loading shared classes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sharedClasses || sharedClasses.length === 0) {
    return null; // Don't show the section if there are no shared classes
  }

  const activeClasses = sharedClasses.filter(cls => !cls.isArchived);
  const archivedClasses = sharedClasses.filter(cls => cls.isArchived);

  return (
    <>
      {activeClasses.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Classes Shared With Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeClasses.map((cls) => (
                <Card
                  key={cls.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/class/${cls.id}/analytics`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      <CollaboratorBadge role={cls.role} size="sm" />
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Code:</span>
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {cls.classCode}
                        </code>
                      </div>
                      
                      {cls.subject && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Subject:</span>
                          <span>{cls.subject}</span>
                        </div>
                      )}
                      
                      {cls.gradeLevel && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Grade:</span>
                          <span>{cls.gradeLevel}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CalendarDays className="h-3 w-3" />
                        <span>Joined {format(new Date(cls.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/class/${cls.id}/analytics`);
                        }}
                      >
                        View Analytics
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyClassLink(cls.classCode);
                        }}
                        title="Copy class link"
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {archivedClasses.length > 0 && (
        <Card className="mb-8 opacity-75">
          <CardHeader>
            <CardTitle className="text-gray-600 dark:text-gray-400">
              Archived Shared Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedClasses.map((cls) => (
                <Card
                  key={cls.id}
                  className="bg-gray-50 dark:bg-gray-900"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                        {cls.name}
                      </h3>
                      <CollaboratorBadge role={cls.role} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500">
                      This class has been archived
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}