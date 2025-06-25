import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the new login page
    setLocation("/login");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}
