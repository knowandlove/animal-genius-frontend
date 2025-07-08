import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface PermissionGateProps {
  canAccess: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  tooltip?: string;
  showLockIcon?: boolean;
}

export function PermissionGate({
  canAccess,
  children,
  fallback,
  tooltip = "You don't have permission to access this feature",
  showLockIcon = true,
}: PermissionGateProps) {
  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default disabled state with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block opacity-50 cursor-not-allowed">
            <div className="pointer-events-none select-none">
              {children}
            </div>
            {showLockIcon && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}