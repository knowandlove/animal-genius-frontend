import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface HelpTooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function HelpTooltip({ 
  content, 
  children,
  side = "top",
  align = "center"
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-xs"
        >
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
