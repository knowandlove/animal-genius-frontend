import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";

export default function EmailConfirmation() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash;
    
    if (!hash) {
      setStatus("error");
      setMessage("No confirmation token found.");
      return;
    }

    // Parse the hash parameters
    const params = new URLSearchParams(hash.substring(1));
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    
    if (error) {
      setStatus("error");
      setMessage(errorDescription || "Email confirmation failed.");
      return;
    }

    // If we got here, the email was confirmed successfully
    const accessToken = params.get("access_token");
    const tokenType = params.get("type");
    
    if (accessToken && tokenType === "signup") {
      setStatus("success");
      setMessage("Your email has been verified successfully! You can now log in.");
      
      // Clear the URL hash
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Clear any pending verification email
      localStorage.removeItem("pendingVerificationEmail");
    } else {
      setStatus("error");
      setMessage("Invalid confirmation link.");
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                status === "processing" ? "bg-blue-100" :
                status === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                {status === "processing" && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
                {status === "success" && <CheckCircle className="h-8 w-8 text-green-600" />}
                {status === "error" && <XCircle className="h-8 w-8 text-red-600" />}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {status === "processing" && "Confirming Email..."}
                {status === "success" && "Email Confirmed!"}
                {status === "error" && "Confirmation Failed"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              {status === "success" && (
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              )}
              
              {status === "error" && (
                <div className="space-y-3">
                  <Button
                    onClick={() => setLocation("/register")}
                    variant="outline"
                    className="w-full"
                  >
                    Try Registering Again
                  </Button>
                  <Button
                    onClick={() => setLocation("/login")}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
