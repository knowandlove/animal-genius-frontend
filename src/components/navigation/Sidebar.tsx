import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Users,
  Coins,
  Settings,
  MapPin,
  BookOpen,
  UserPlus,
  FileText,
  Home,
  Layout
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface SidebarProps {
  classId?: string;
  className?: string;
  classCode?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ 
  classId, 
  className, 
  classCode,
  isCollapsed = false,
  onToggleCollapse 
}: SidebarProps) {
  const [location] = useLocation();

  // Generate navigation items for class context
  const navigationItems: SidebarItem[] = classId ? [
    {
      id: 'dashboard',
      label: 'Class Dashboard',
      href: `/class/${classId}/dashboard`,
      icon: Layout
    },
    {
      id: 'learning',
      label: 'Learning Lounge',
      href: `/learning-lounge?classId=${classId}`,
      icon: BookOpen
    },
    {
      id: 'analytics',
      label: 'Class Analytics',
      href: `/class/${classId}/analytics`,
      icon: BarChart3
    },
    {
      id: 'island',
      label: 'Class Island',
      href: `/teacher/class/${classId}/island`,
      icon: MapPin
    },
    {
      id: 'economy',
      label: 'Economy',
      href: `/class/${classId}/economy`,
      icon: Coins
    },
    {
      id: 'groups',
      label: 'Groups',
      href: `/group-maker?classId=${classId}`,
      icon: UserPlus
    },
    {
      id: 'reports',
      label: 'Class Report',
      href: `/class-report/${classId}`,
      icon: FileText
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/class/${classId}/settings`,
      icon: Settings
    }
  ] : [];

  // Check if current location matches item href
  const isItemActive = (href: string) => {
    return location === href || location.startsWith(href);
  };

  return (
    <aside className={cn(
      "flex flex-col bg-white border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      "h-full"
    )}>
      
      {/* Class Header */}
      {classId && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-heading text-foreground font-semibold truncate">
                  {className || 'Class'}
                </h2>
                {classCode && (
                  <p className="text-xs font-body text-muted-foreground">
                    Code: {classCode}
                  </p>
                )}
              </div>
            )}
            
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="hidden lg:flex shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          
          return (
            <Link key={item.id} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                active 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}>
                <Icon className={cn(
                  "shrink-0",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                )} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}