import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Class } from "@shared/schema";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";

// Create a standalone schema for class creation
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  schoolName: z.string().optional(),
});
type CreateClassData = z.infer<typeof createClassSchema>;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CreateClass() {
  const [, setLocation] = useLocation();
  const [createdClass, setCreatedClass] = useState<Class | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/login");
      return;
    }
  }, [setLocation]);

  // Get user information
  const { data: userData } = useQuery({
    queryKey: ["/api/me"],
    enabled: !!localStorage.getItem("authToken"),
  });

  useEffect(() => {
    if (userData) {
      setUser(userData as User);
    }
  }, [userData]);

  const form = useForm<CreateClassData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      subject: "",
      gradeLevel: "",
      schoolName: "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassData) => {
      const token = localStorage.getItem("authToken");
      return apiRequest("POST", "/api/classes", data);
    },
    onSuccess: (data) => {
      setCreatedClass(data);
      // Invalidate classes cache to show new class immediately
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class Created Successfully!",
        description: `Your class "${data.name}" is ready for students.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Class",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClassData) => {
    createClassMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link has been copied to clipboard.",
    });
  };

  // Show success page if class was created
  if (createdClass) {
    const fullUrl = `${window.location.origin}/q/${createdClass.passportCode}`;
    const shortUrl = `${window.location.origin}/q/${createdClass.passportCode}`;

    return (
      <div className="min-h-screen">
        <Header 
          isAuthenticated={!!user}
          user={user || undefined}
          onLogout={() => {
            localStorage.removeItem("authToken");
            setLocation("/login");
          }}
        />
        
        <div className="py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-xl">
              <CardContent className="p-8 text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl bg-blue-100"
                >
                  📚
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Class Created Successfully!</h2>
                <p className="text-gray-600 mb-8">Your new class is ready for students. Here are the sharing details:</p>

                <Card className="bg-gray-50 mb-8">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Class Name</label>
                        <p className="text-lg font-bold text-gray-900">{createdClass.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Class Code</label>
                        <p className="text-lg font-bold text-blue-600">{createdClass.passportCode}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Full Quiz URL</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input value={fullUrl} readOnly className="font-mono text-sm" />
                          <Button onClick={() => copyToClipboard(fullUrl)} size="sm">
                            📋
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Short URL</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input value={shortUrl} readOnly className="font-mono text-sm" />
                          <Button onClick={() => copyToClipboard(shortUrl)} size="sm">
                            📋
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setLocation("/dashboard")} className="flex-1">
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => setLocation(`/class/${createdClass.id}/analytics`)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    View Class Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        isAuthenticated={!!user}
        user={user || undefined}
        onLogout={() => {
          localStorage.removeItem("authToken");
          setLocation("/login");
        }}
      />
      
      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full mb-4 mx-auto"></div>
              <CardTitle className="text-3xl font-bold text-gray-900">Create New Class</CardTitle>
              <p className="text-gray-600">Set up a new class for your students to take the Animal Genius Quiz</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7th Grade Biology, Period 3" {...field} />
                        </FormControl>
                        <p className="text-sm text-gray-500">This will be visible to students when they take the quiz</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Biology, English, Math" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Level (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 7th Grade, High School" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lincoln Middle School" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Class Code Generation</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your class will be automatically assigned a unique 6-character code that students will use to access the quiz.
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="bg-white border-2 border-dashed border-blue-500 rounded-lg px-4 py-2 text-blue-600 font-mono font-bold text-lg">
                          AUTO-GENERATED
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-mono font-bold">
                          ABC123
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" className="w-full text-lg py-4" disabled={createClassMutation.isPending}>
                    {createClassMutation.isPending ? "Creating Class..." : "Create Class"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
