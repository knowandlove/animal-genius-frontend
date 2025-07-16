import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";

// Create a proper registration schema matching the backend
const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  schoolOrganization: z.string().min(1, "School/organization is required"),
  roleTitle: z.string().optional(),
  howHeardAbout: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function TeacherRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      schoolOrganization: "",
      roleTitle: "",
      howHeardAbout: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegistrationData, "confirmPassword">) => {
      return apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: (data) => {
      if (data.requiresEmailVerification) {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to verify your account before logging in.",
        });
        setLocation("/login");
      } else {
        // Auto-login if no email verification required
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        
        // Dispatch custom event to update router state
        window.dispatchEvent(new Event('authTokenChanged'));
        
        toast({
          title: "Welcome to Animal Genius!",
          description: "Your account has been created successfully.",
        });
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      // Check if it's a validation error with specific field messages
      let errorMessage = error.message || "Registration failed";
      
      // If the backend returns validation errors, show them
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.entries(errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(", ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationData) => {
    const { confirmPassword, ...submitData } = data;
    registerMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">👩‍🏫</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Create Teacher Account</CardTitle>
              <p className="text-gray-600">Get started with your Animal Genius classroom</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
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
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a strong password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schoolOrganization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School/Organization Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Lincoln Middle School" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role/Title</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="Counselor">Counselor</SelectItem>
                            <SelectItem value="Administrator">Administrator</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="howHeardAbout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about us?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Colleague Recommendation">Colleague Recommendation</SelectItem>
                            <SelectItem value="Conference/Workshop">Conference/Workshop</SelectItem>
                            <SelectItem value="Search Engine">Search Engine</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full text-lg py-4" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating Account..." : "Create Account & Get Started"}
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setLocation("/login")}>
                      Sign in here
                    </Button>
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}