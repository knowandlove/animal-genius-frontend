import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading-spinner";
import { KeyRound } from "lucide-react";

interface PassportCodeDialogProps {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  passportCode: string;
  error?: string | null;
  onSubmit: (code: string) => Promise<void>;
  title?: string;
  description?: string;
}

export default function PassportCodeDialog({ 
  open, 
  onSuccess,
  onClose, 
  passportCode,
  error,
  onSubmit,
  title = "Enter Your Passport Code",
  description = "You need to enter your passport code to access this room."
}: PassportCodeDialogProps) {
  const [code, setCode] = useState(passportCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Reset submission state when dialog opens
  useEffect(() => {
    if (open) {
      setHasSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    setHasSubmitted(true);
    
    try {
      await onSubmit(code.toUpperCase());
      onSuccess();
    } catch (err) {
      // Error is handled by parent
      // Reset hasSubmitted on error to allow retry
      setTimeout(() => setHasSubmitted(false), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passport-code">Passport Code</Label>
              <Input
                id="passport-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXX-XXX"
                maxLength={7}
                pattern="[A-Z]{3}-[A-Z0-9]{3}"
                className="font-mono text-center text-lg"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Format: 3 letters - 3 letters/numbers (e.g., DOG-X7K)
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            {onClose && (
              <Button 
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || hasSubmitted || code.length < 6}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Checking...
                </>
              ) : (
                'Enter Room'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}