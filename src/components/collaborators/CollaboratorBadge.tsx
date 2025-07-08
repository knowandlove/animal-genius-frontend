import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Edit3 } from "lucide-react";

interface CollaboratorBadgeProps {
  role: 'owner' | 'editor' | 'viewer';
  size?: 'sm' | 'md' | 'lg';
}

export function CollaboratorBadge({ role, size = 'md' }: CollaboratorBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const roleConfig = {
    owner: {
      label: 'Owner',
      icon: Shield,
      variant: 'default' as const,
      className: 'bg-primary text-primary-foreground'
    },
    editor: {
      label: 'Co-Teacher',
      icon: Edit3,
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    },
    viewer: {
      label: 'Observer',
      icon: Eye,
      variant: 'outline' as const,
      className: 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400'
    }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClasses[size]} ${config.className} inline-flex items-center gap-1`}
    >
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      {config.label}
    </Badge>
  );
}