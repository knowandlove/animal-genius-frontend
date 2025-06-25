import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import Header from "@/components/header";

export default function EmailVerificationPending() {
  const [, setLocation] = useLocation();
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const email = localStorage.getItem("pendingVerificationEmail");

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendStatus("sending");
    
    try {
      // Note: You'll need to implement this endpoint
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setResendStatus("sent");
        setTimeout(() => setResendStatus("idle"), 5000);
      }
    } catch (error) {
      console.error("Failed to resend email:", error);
      setResendStatus("idle");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Email
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-6">
                We've sent a verification link to:
              </p>
              
              <p className="font-mono text-sm bg-gray-100 p-3 rounded mb-6">
                {email || "your email address"}
              </p>
              
              <p className="text-gray-600 mb-8">
                Please click the link in the email to verify your account and complete registration.
              </p>
              
              <div className="space-y-4">
                {resendStatus === "sent" ? (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verification email resent!
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={resendStatus === "sending" || !email}
                    className="w-full"
                  >
                    {resendStatus === "sending" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Check your spam folder if you don't see the email in your inbox.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
