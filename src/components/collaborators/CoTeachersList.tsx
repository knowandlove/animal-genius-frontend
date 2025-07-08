import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CollaboratorBadge } from "./CollaboratorBadge";
import { UserX, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { ClassCollaboratorResponse } from "@/types/collaborators";

interface CoTeachersListProps {
  classId: string;
  canManageCollaborators: boolean;
}

export function CoTeachersList({ classId, canManageCollaborators }: CoTeachersListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery<{ collaborators: ClassCollaboratorResponse[], userRole?: string }>({
    queryKey: [`/api/classes/${classId}/collaborators`],
    queryFn: async () => {
      return await apiRequest("GET", `/api/classes/${classId}/collaborators`);
    },
  });

  const collaborators = response?.collaborators || [];

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      return await apiRequest("DELETE", `/api/classes/${classId}/collaborators/${collaboratorId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collaborator removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/collaborators`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove collaborator",
        variant: "destructive",
      });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      return await apiRequest("POST", `/api/classes/${classId}/collaborators/${collaboratorId}/resend`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading collaborators...</div>
        </CardContent>
      </Card>
    );
  }

  if (!collaborators || collaborators.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No co-teachers yet
            </h3>
            <p className="text-gray-600">
              Invite other teachers to collaborate on this class
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Co-Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(collaborator.teacherName, collaborator.teacherEmail)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {collaborator.teacherName || collaborator.teacherEmail}
                    </h4>
                    <CollaboratorBadge role={collaborator.role} size="sm" />
                    {getStatusIcon(collaborator.invitationStatus)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {collaborator.teacherEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Invited by {collaborator.invitedByName || collaborator.invitedByEmail} on{' '}
                    {format(new Date(collaborator.invitedAt), 'MMM d, yyyy')}
                  </p>
                  {collaborator.acceptedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Joined {format(new Date(collaborator.acceptedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
              
              {canManageCollaborators && (
                <div className="flex items-center gap-2">
                  {collaborator.invitationStatus === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvitationMutation.mutate(collaborator.id)}
                      disabled={resendInvitationMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to remove this collaborator?')) {
                        removeCollaboratorMutation.mutate(collaborator.id);
                      }
                    }}
                    disabled={removeCollaboratorMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}