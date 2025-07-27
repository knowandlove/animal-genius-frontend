import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, User, Settings, LogOut, Home, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function for animal image paths
function getAnimalImagePath(animal: string): string {
  const imageMap: Record<string, string> = {
    'Meerkat': '/images/meerkat.png',
    'Panda': '/images/panda.png',
    'Owl': '/images/owl.png',
    'Beaver': '/images/beaver.png',
    'Elephant': '/images/elephant.png',
    'Otter': '/images/otter.png',
    'Parrot': '/images/parrot.png',
    'Border Collie': '/images/collie.png'
  };
  return imageMap[animal] || '/images/kal-character.png';
}

interface TopBarProps {
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  user?: { firstName: string; lastName: string; isAdmin?: boolean; personalityAnimal?: string };
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function TopBar({ 
  isAuthenticated, 
  onLogin, 
  onLogout, 
  user,
  onToggleSidebar,
  showSidebarToggle = false
}: TopBarProps) {
  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left side: Logo + Mobile menu toggle */}
        <div className="flex items-center space-x-3">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3">
            <img 
              src="/images/KALlogocolor.svg" 
              alt="KAL Logo" 
              className="w-10 h-10"
            />
            <div className="flex flex-col leading-tight">
              <div className="font-heading text-foreground font-bold text-[16px] mt-[1px] mb-[1px]">
                Animal Genius Quiz®
              </div>
              <div className="font-body text-foreground/70 mt-[0px] mb-[0px] text-[12px]">
                Leadership Assessment for Kids
              </div>
            </div>
          </Link>
        </div>

        {/* Right side: User menu or login */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* My Classes button */}
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline font-body">My Classes</span>
                </Link>
              </Button>

              {/* User dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {user?.personalityAnimal ? (
                      <img 
                        src={getAnimalImagePath(user.personalityAnimal)} 
                        alt={user.personalityAnimal}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline font-body">
                      {user?.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start space-x-2 p-2">
                    {user?.personalityAnimal ? (
                      <img 
                        src={getAnimalImagePath(user.personalityAnimal)} 
                        alt={user.personalityAnimal}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    {user?.personalityAnimal && (
                      <span className="text-xs text-muted-foreground">
                        ({user.personalityAnimal})
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/community" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Community Hub
                    </Link>
                  </DropdownMenuItem>
                  
                  {user?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center text-primary">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={onLogout} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Version 1.1.6
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={onLogin}>
              Teacher Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}