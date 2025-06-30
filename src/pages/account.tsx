import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import Header from "@/components/header";
import { TeacherQuizModal } from "@/components/TeacherQuizModal";
import { HelpCircle } from "lucide-react";

// Form schemas
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  schoolOrganization: z.string().min(1, "School/Organization is required"),
  roleTitle: z.string().optional(),
  howHeardAbout: z.string().optional(),
  personalityAnimal: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolOrganization: string;
  roleTitle?: string;
  howHeardAbout?: string;
  personalityAnimal?: string;
}

export default function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      setLocation("/login");
      return;
    }
  }, [setLocation]);

  // Fetch user profile
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(api("/api/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to fetch user data");
    },
    enabled: !!localStorage.getItem("authToken"),
    retry: 1,
  });

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Account state:", { 
        user: user ? `${user.firstName} ${user.lastName}` : null, 
        authToken: !!localStorage.getItem("authToken"), 
        isLoading, 
        error: error?.message || 'no error'
      });
    }
  }, [user, isLoading, error]);

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      schoolOrganization: "",
      roleTitle: "",
      howHeardAbout: "",
      personalityAnimal: "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        schoolOrganization: user.schoolOrganization || "",
        roleTitle: user.roleTitle || "",
        howHeardAbout: user.howHeardAbout || "",
        personalityAnimal: user.personalityAnimal || "",
      });
    }
  }, [user, profileForm]);

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest("PUT", "/api/me/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      return apiRequest("PUT", "/api/me/password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  // Update form defaults when user data loads
  if (user && !profileForm.getValues().firstName) {
    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      schoolOrganization: user.schoolOrganization,
      roleTitle: user.roleTitle || "",
      howHeardAbout: user.howHeardAbout || "",
    });
  }

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    updatePasswordMutation.mutate(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    // Dispatch custom event to update router state
    window.dispatchEvent(new Event('authTokenChanged'));
    
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        isAuthenticated={true} 
        user={user ? { firstName: user.firstName, lastName: user.lastName } : undefined}
        onLogout={handleLogout} 
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600 mt-2">Manage your profile and account preferences</p>
              </div>
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              👤 Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              🔒 Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              ⚙️ Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="schoolOrganization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School/Organization</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="roleTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role/Title (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 6th Grade Teacher, Counselor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="personalityAnimal"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>My Teaching Animal</FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setShowQuizModal(true)}
                              className="text-blue-600 p-0 h-auto"
                            >
                              <HelpCircle className="w-4 h-4 mr-1" />
                              Take the quiz
                            </Button>
                          </div>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your animal or take the quiz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="not-selected">Not selected</SelectItem>
                              <SelectItem value="Meerkat">Meerkat - Creative & Empathetic</SelectItem>
                              <SelectItem value="Panda">Panda - Reflective & Strategic</SelectItem>
                              <SelectItem value="Owl">Owl - Analytical & Adaptable</SelectItem>
                              <SelectItem value="Beaver">Beaver - Reliable & Organized</SelectItem>
                              <SelectItem value="Elephant">Elephant - Caring & Social</SelectItem>
                              <SelectItem value="Otter">Otter - Playful & Energetic</SelectItem>
                              <SelectItem value="Parrot">Parrot - Enthusiastic & Creative</SelectItem>
                              <SelectItem value="Border Collie">Border Collie - Leadership & Goal-oriented</SelectItem>
                            </SelectContent>
                          </Select>
                          {field.value && field.value !== "not-selected" && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <a 
                                href="/teacher/personality-results"
                                className="text-blue-600 hover:underline"
                              >
                                View your personality results →
                              </a>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="howHeardAbout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you hear about us? (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Colleague, Social media, Conference" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Update your password and manage security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updatePasswordMutation.isPending}
                        className="min-w-[140px]"
                      >
                        {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Display Settings</h4>
                    <p className="text-sm text-gray-600">
                      Theme and display preferences will be available in a future update.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Data Export</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download your class data and student results for your records.
                    </p>
                    <Button variant="outline" disabled>
                      Export Data (Coming Soon)
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Account Management</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Need help with your account? Contact support for assistance.
                    </p>
                    <Button variant="outline" disabled>
                      Contact Support (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Teacher Quiz Modal */}
      <TeacherQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onComplete={(animal) => {
          profileForm.setValue("personalityAnimal", animal);
          setShowQuizModal(false);
          toast({
            title: "Quiz Complete!",
            description: `Your teaching personality animal is ${animal}!`,
          });
        }}
      />
    </div>
  );
}