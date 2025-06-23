import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Save, X, AlertTriangle } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  itemCount?: number;
  mode?: 'avatar' | 'room';
}

export function UnsavedChangesModal({ 
  isOpen, 
  onSave, 
  onDiscard, 
  onCancel,
  itemCount,
  mode 
}: UnsavedChangesModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-xl">Unsaved Changes</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-3">
            You have unsaved changes to your {mode === 'avatar' ? 'avatar' : 'room'}. 
            {itemCount && itemCount > 0 && (
              <span className="block mt-2 text-sm">
                {mode === 'room' 
                  ? `${itemCount} item${itemCount > 1 ? 's' : ''} modified`
                  : `${itemCount} equipment change${itemCount > 1 ? 's' : ''}`
                }
              </span>
            )}
            What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel}>
              Keep Editing
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onDiscard}>
              <X className="w-4 h-4 mr-2" />
              Discard Changes
            </Button>
          </AlertDialogAction>
          <AlertDialogAction asChild>
            <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
