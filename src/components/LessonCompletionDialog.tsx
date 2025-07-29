import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Coins } from "lucide-react";

interface LessonCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  studentCount: number;
  isLoading?: boolean;
  lessonNumber: number;
}

export function LessonCompletionDialog({
  open,
  onOpenChange,
  onConfirm,
  studentCount,
  isLoading = false,
}: LessonCompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Complete Lesson & Award Coins?
          </DialogTitle>
          <DialogDescription className="pt-3 space-y-3">
            <p>
              Completing this lesson will award <strong>10 coins</strong> to all{" "}
              <strong>{studentCount}</strong> students in your class.
            </p>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              This action can be undone, but coins will remain with students.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Completing..." : "Complete Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LessonResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  lessonNumber: number;
}

export function LessonResetDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  lessonNumber,
}: LessonResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Lesson {lessonNumber}?</DialogTitle>
          <DialogDescription className="pt-3 space-y-3">
            <p>
              This will reset all activity progress for this lesson and mark it as incomplete.
            </p>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Students will keep any coins they&apos;ve earned from this lesson.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}