import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const classCodeSchema = z.object({
  classCode: z
    .string()
    .min(1, "Class code is required")
    .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .refine(val => val.length === 6, "Class code must be 6 characters")
    .refine(val => /^[A-Z0-9]{6}$/.test(val), "Class code must contain only letters and numbers"),
});

type LoginData = z.infer<typeof loginSchema>;
type ClassCodeData = z.infer<typeof classCodeSchema>;

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const classCodeForm = useForm<ClassCodeData>({
    resolver: zodResolver(classCodeSchema),
    defaultValues: {
      classCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async (data) => {
      login(data.token, data.user, data.refreshToken);
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      
      // Dispatch auth token changed event and add delay for state to settle
      window.dispatchEvent(new Event('authTokenChanged'));
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onClassCodeSubmit = (data: ClassCodeData) => {
    // Format the class code with hyphen for display
    const formattedCode = data.classCode.slice(0, 3) + '-' + data.classCode.slice(3);
    
    // Redirect to the quiz page with the class code
    setLocation(`/q/${formattedCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/images/KALlogocolor.svg" 
              alt="KAL Logo" 
              className="w-14 h-14"
            />
            <div className="flex flex-col text-left leading-tight">
              <div className="font-heading text-foreground font-bold text-2xl">Animal Genius Quiz®</div>
              <div className="font-body text-foreground/70 text-sm">Leadership Assessment for Kids</div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-bold">Teacher Login</h2>
            <p className="text-muted-foreground text-sm">Sign in to your dashboard</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@school.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button variant="link" className="p-0 h-auto" onClick={() => setLocation("/register")}>
                Register here
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Join Class Section */}
        <div className="mt-6">
          <Card className="shadow-xl border-0 bg-primary/5">
            <CardHeader className="text-center pb-2">
              <h2 className="text-2xl font-bold">Students Join Here</h2>
              <p className="text-muted-foreground text-sm">Enter your class code to take the quiz</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <Form {...classCodeForm}>
                <form onSubmit={classCodeForm.handleSubmit(onClassCodeSubmit)} className="space-y-4">
                  <FormField
                    control={classCodeForm.control}
                    name="classCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Code</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="ABC-123" 
                            className="text-center text-lg uppercase"
                            maxLength={7}
                            {...field}
                            onChange={(e) => {
                              // Allow typing with or without hyphen
                              const value = e.target.value.toUpperCase();
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Ask your teacher for the 6-character class code
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" size="lg" variant="default">
                    Join Class
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; 2024 Animal Genius Quiz System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
