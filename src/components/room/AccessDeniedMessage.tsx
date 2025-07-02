import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface AccessDeniedMessageProps {
  reason: 'private' | 'invite_only' | 'different_class' | 'unknown';
  studentName?: string;
}

export default function AccessDeniedMessage({ reason, studentName }: AccessDeniedMessageProps) {
  const [, setLocation] = useLocation();

  const getMessage = () => {
    switch (reason) {
      case 'private':
        return {
          icon: <Lock className="w-16 h-16 text-gray-400" />,
          title: "This Room is Private",
          description: `${studentName ? `${studentName} has` : 'This student has'} set their room to private. Only they can view it.`,
          hint: "Try visiting other classmates' rooms or decorate your own!"
        };
      case 'invite_only':
        return {
          icon: <Mail className="w-16 h-16 text-gray-400" />,
          title: "Invitation Required",
          description: `You need an invitation to visit ${studentName ? `${studentName}'s` : 'this'} room.`,
          hint: "Check your mailbox for invitations or ask them to invite you!"
        };
      case 'different_class':
        return {
          icon: <Users className="w-16 h-16 text-gray-400" />,
          title: "Different Class",
          description: "You can only visit rooms of students in your own class.",
          hint: "Visit your classmates' rooms instead!"
        };
      default:
        return {
          icon: <Lock className="w-16 h-16 text-gray-400" />,
          title: "Room Not Accessible",
          description: "You don't have permission to view this room.",
          hint: "Make sure you're visiting a classmate's room."
        };
    }
  };

  const { icon, title, description, hint } = getMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="p-8 max-w-md text-center">
        <div className="mb-6">{icon}</div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        <p className="text-sm text-muted-foreground mb-6">{hint}</p>
        <div className="space-y-2">
          <Button 
            onClick={() => setLocation('/')}
            className="w-full"
          >
            Go to Class Directory
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}