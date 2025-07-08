import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function TeacherLogin() {
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

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async (data) => {
      login(data.token, data.user, data.refreshToken);
      
      // Dispatch custom event to update router state
      window.dispatchEvent(new Event('authTokenChanged'));
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      
      // Small delay to ensure auth state is propagated
      setTimeout(() => {
        setLocation("/dashboard");
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🔐</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
              <p className="text-gray-600">Sign in to your teacher dashboard</p>
            </CardHeader>
            
            <CardContent className="p-8">
              {loginMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="text-red-400">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Login Failed
                      </h3>
                      <div className="mt-1 text-sm text-red-700">
                        {loginMutation.error?.message || "Please check your credentials and try again."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  <Button type="submit" className="w-full text-lg py-4" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>



              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{" "}
                <Button variant="link" className="p-0" onClick={() => setLocation("/register")}>
                  Register here
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
