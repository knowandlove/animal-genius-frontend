import { useState } from "react";
import { Settings, Lock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPassportAuthHeaders } from "@/lib/passport-auth";
import { LoadingSpinner } from "@/components/loading-spinner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoomSettingsButtonProps {
  passportCode: string;
  currentVisibility?: string;
  canEdit: boolean;
}

export default function RoomSettingsButton({ passportCode, currentVisibility = 'class', canEdit }: RoomSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibility, setVisibility] = useState(currentVisibility);
  const queryClient = useQueryClient();

  const updateVisibilityMutation = useMutation({
    mutationFn: (newVisibility: string) => 
      apiRequest('PATCH', `/api/room/${passportCode}/settings/visibility`, { visibility: newVisibility }, {
        headers: getPassportAuthHeaders()
      }),
    onSuccess: (data) => {
      // Update local cache
      queryClient.setQueryData([`/api/room-page-data/${passportCode}`], (old: any) => {
        if (old) {
          return {
            ...old,
            room: {
              ...old.room,
              roomVisibility: data.visibility
            }
          };
        }
        return old;
      });
      setIsOpen(false);
    },
  });

  if (!canEdit) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-colors bg-gray-600 hover:bg-gray-700 text-white"
        title="Room Settings"
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Room Privacy Settings</DialogTitle>
            <DialogDescription>
              Choose who can visit your room
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup value={visibility} onValueChange={setVisibility}>
              <div className="space-y-3">
                <label
                  htmlFor="class"
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    visibility === 'class' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <RadioGroupItem value="class" id="class" className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="class" className="font-medium cursor-pointer">
                        My Class
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Classmates can visit your room
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="private"
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    visibility === 'private' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-600" />
                      <Label htmlFor="private" className="font-medium cursor-pointer">
                        Just Me
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Only you can see your room
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>

            {updateVisibilityMutation.error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  Failed to update settings. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateVisibilityMutation.mutate(visibility)}
              disabled={updateVisibilityMutation.isPending || visibility === currentVisibility}
            >
              {updateVisibilityMutation.isPending ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}