import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Eye, Edit3 } from "lucide-react";
import type { CollaboratorRole, CollaboratorPermissions } from "@/types/collaborators";

interface InviteCoTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export function InviteCoTeacherModal({ 
  isOpen, 
  onClose, 
  classId, 
  className 
}: InviteCoTeacherModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("viewer");
  const [message, setMessage] = useState("");
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({
    can_view_analytics: true,
    can_manage_students: false,
    can_manage_store: false,
    can_export_data: false,
    can_send_messages: false,
    can_manage_curriculum: false,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/classes/${classId}/collaborators/invite`, {
        email,
        role,
        permissions: role === "editor" ? permissions : undefined,
        message: message.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/collaborators`] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setRole("viewer");
    setMessage("");
    setPermissions({
      can_view_analytics: true,
      can_manage_students: false,
      can_manage_store: false,
      can_export_data: false,
      can_send_messages: false,
      can_manage_curriculum: false,
    });
  };

  const handlePermissionChange = (permission: keyof CollaboratorPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Co-Teacher to {className}
          </DialogTitle>
          <DialogDescription>
            Invite another teacher to collaborate on this class. They'll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Teacher Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label>Role</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as CollaboratorRole)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="viewer" id="viewer" />
                <div className="grid gap-1 flex-1">
                  <Label htmlFor="viewer" className="flex items-center gap-2 cursor-pointer">
                    <Eye className="h-4 w-4" />
                    Observer (View Only)
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Can view class data, analytics, and student progress but cannot make changes
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="editor" id="editor" />
                <div className="grid gap-1 flex-1">
                  <Label htmlFor="editor" className="flex items-center gap-2 cursor-pointer">
                    <Edit3 className="h-4 w-4" />
                    Co-Teacher (Editor)
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Can manage class with customizable permissions below
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {role === "editor" && (
            <div className="grid gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label className="text-sm font-medium">Editor Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analytics"
                    checked={permissions.can_view_analytics}
                    onCheckedChange={() => handlePermissionChange('can_view_analytics')}
                  />
                  <Label htmlFor="analytics" className="text-sm cursor-pointer">
                    View class analytics and reports
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="students"
                    checked={permissions.can_manage_students}
                    onCheckedChange={() => handlePermissionChange('can_manage_students')}
                  />
                  <Label htmlFor="students" className="text-sm cursor-pointer">
                    Manage students (add, remove, edit)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="store"
                    checked={permissions.can_manage_store}
                    onCheckedChange={() => handlePermissionChange('can_manage_store')}
                  />
                  <Label htmlFor="store" className="text-sm cursor-pointer">
                    Manage class economy and store
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export"
                    checked={permissions.can_export_data}
                    onCheckedChange={() => handlePermissionChange('can_export_data')}
                  />
                  <Label htmlFor="export" className="text-sm cursor-pointer">
                    Export class data
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="messages"
                    checked={permissions.can_send_messages}
                    onCheckedChange={() => handlePermissionChange('can_send_messages')}
                  />
                  <Label htmlFor="messages" className="text-sm cursor-pointer">
                    Send messages to students
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curriculum"
                    checked={permissions.can_manage_curriculum}
                    onCheckedChange={() => handlePermissionChange('can_manage_curriculum')}
                  />
                  <Label htmlFor="curriculum" className="text-sm cursor-pointer">
                    Manage learning lounge content
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}