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
import { CLASS_ICONS, CLASS_ICONS_MAP } from "@/components/class-icons";

// Color options with brand colors
const BACKGROUND_COLORS = [
  { id: 'beaver-green', hex: '#829B79', label: 'Beaver Green' },
  { id: 'panda-blue', hex: '#85B2C8', label: 'Panda Blue' },
  { id: 'parrot-coral', hex: '#FF8070', label: 'Parrot Coral' },
  { id: 'elephant-purple', hex: '#BD85C8', label: 'Elephant Purple' },
  { id: 'owl-green', hex: '#BAC97D', label: 'Owl Green' },
  { id: 'otter-orange', hex: '#FACC7D', label: 'Otter Orange' },
  { id: 'collie-tan', hex: '#DEA77E', label: 'Collie Tan' },
  { id: 'meerkat-gray', hex: '#4B4959', label: 'Meerkat Gray' },
];

// Create a standalone schema for class creation
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  icon: z.string().optional().default('book'),
  backgroundColor: z.string().optional().default('#829B79'),
  numberOfStudents: z.number().min(1, "Number of students must be at least 1").optional(),
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
      icon: "book",
      backgroundColor: "#829B79",
      numberOfStudents: undefined,
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
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: createdClass.backgroundColor || '#829B79' }}
                >
                  {(() => {
                    const IconComponent = CLASS_ICONS_MAP[createdClass.icon || 'book'];
                    return IconComponent ? <IconComponent className="w-10 h-10 text-white" /> : null;
                  })()}
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

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("backgroundColor");

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
              <div 
                className="w-16 h-16 rounded-full mb-4 mx-auto flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                {(() => {
                  const IconComponent = CLASS_ICONS_MAP[selectedIcon || 'book'];
                  return IconComponent ? <IconComponent className="w-8 h-8 text-white" /> : null;
                })()}
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Create New Class</CardTitle>
              <p className="text-gray-600">Set up a new class for your students to take the Animal Genius Quiz®</p>
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
                      name="numberOfStudents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Students (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 25" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-sm text-gray-500">Expected number of students in this class</p>
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

                  {/* Icon Selection */}
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Class Icon</FormLabel>
                        <div className="grid grid-cols-6 gap-3 mt-2">
                          {CLASS_ICONS.map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => field.onChange(id)}
                              className={`
                                w-full aspect-square rounded-lg flex items-center justify-center
                                transition-all duration-200 ${
                                  field.value === id 
                                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                                    : 'hover:scale-105'
                                }
                              `}
                              style={{ 
                                backgroundColor: field.value === id ? selectedColor : '#e5e7eb',
                                color: field.value === id ? 'white' : '#6b7280'
                              }}
                              title={label}
                            >
                              <Icon className="w-6 h-6" />
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Selection */}
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Background Color</FormLabel>
                        <div className="grid grid-cols-4 gap-3 mt-2">
                          {BACKGROUND_COLORS.map((color) => (
                            <button
                              key={color.id}
                              type="button"
                              onClick={() => field.onChange(color.hex)}
                              className={`
                                w-full h-12 rounded-lg transition-all duration-200 relative
                                ${field.value === color.hex 
                                  ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' 
                                  : 'hover:scale-105'
                                }
                              `}
                              style={{ backgroundColor: color.hex }}
                              title={color.label}
                            >
                              {field.value === color.hex && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
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
