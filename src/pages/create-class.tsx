import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Class } from "@shared/schema";
import { z } from "zod";
import { 
  BookOpen, 
  GraduationCap, 
  Palette, 
  Microscope, 
  Calculator, 
  Globe, 
  Rocket, 
  Star, 
  Heart, 
  Lightbulb, 
  Music, 
  TreePine,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getIconColor } from "@/utils/icon-utils";
import Header from "@/components/header";

// Icon mapping system
const iconOptions = [
  { id: 'book-open', component: BookOpen, label: 'Reading/Literature' },
  { id: 'graduation-cap', component: GraduationCap, label: 'General Education' },
  { id: 'palette', component: Palette, label: 'Art/Creative' },
  { id: 'microscope', component: Microscope, label: 'Science' },
  { id: 'calculator', component: Calculator, label: 'Math' },
  { id: 'globe', component: Globe, label: 'Geography/Social Studies' },
  { id: 'rocket', component: Rocket, label: 'Technology/STEM' },
  { id: 'star', component: Star, label: 'Special Programs' },
  { id: 'heart', component: Heart, label: 'Health/PE' },
  { id: 'lightbulb', component: Lightbulb, label: 'Innovation' },
  { id: 'music', component: Music, label: 'Music/Arts' },
  { id: 'tree-pine', component: TreePine, label: 'Environmental/Nature' },
];

// Helper function to get icon component by id
const getIconComponent = (iconId: string) => {
  const icon = iconOptions.find(icon => icon.id === iconId);
  return icon ? icon.component : BookOpen;
};

// Create a standalone schema for class creation
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  icon: z.string().default("book-open"),
  backgroundColor: z.string().default("#829B79"), // Convert to hex color
  gradeLevel: z.string().min(1, "Grade level is required"),
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
      icon: "book-open",
      backgroundColor: "#829B79", // Default brand color
      gradeLevel: "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassData) => {
      const token = localStorage.getItem("authToken");
      return apiRequest("POST", "/api/classes", data);
    },
    onSuccess: async (data) => {
      setCreatedClass(data);
      // Invalidate classes cache to show new class immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
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
    const quizUrl = `${window.location.origin}/q/${createdClass.classCode}`;

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
                  style={{ backgroundColor: createdClass.backgroundColor || "#829B79" }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(createdClass.icon || "book-open");
                    return <IconComponent className="w-10 h-10 text-white" />;
                  })()}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Class Created Successfully!</h2>
                <p className="text-gray-600 mb-8">Your new class is ready for students. Here are the sharing details:</p>

                <Card className="bg-gray-50 mb-8">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Class Name</label>
                        <p className="text-lg font-bold text-gray-900">{createdClass.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Class Code</label>
                        <p className="text-lg font-bold text-blue-600">{createdClass.classCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Grade Level</label>
                        <p className="text-lg font-bold text-gray-900">{createdClass.gradeLevel}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-semibold text-gray-700">Student Access Link</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value={quizUrl} readOnly className="font-mono text-sm" />
                        <Button onClick={() => copyToClipboard(quizUrl)} size="sm">
                          📋 Copy
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Copy this link to share with your students, or have them enter the class code <span className="font-mono font-bold">{createdClass.classCode}</span> on the homepage.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setLocation(`/class/${createdClass.id}/dashboard`)} className="flex-1">
                    Go to Class Dashboard
                  </Button>
                  <Button 
                    onClick={() => setLocation(`/classes/${createdClass.id}/live`)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    View Live Discovery Board
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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
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

                  <FormField
                    control={form.control}
                    name="gradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Level *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select grade level</option>
                            <option value="6th Grade">6th Grade</option>
                            <option value="7th Grade">7th Grade</option>
                            <option value="8th Grade">8th Grade</option>
                            <option value="9th Grade">9th Grade</option>
                          </select>
                        </FormControl>
                        <p className="text-sm text-gray-500">All students in this class will be assigned this grade level</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Icon</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 mb-3">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: form.watch("backgroundColor") }}
                                >
                                  {(() => {
                                    const IconComponent = getIconComponent(field.value);
                                    return <IconComponent className="w-6 h-6 text-white" />;
                                  })()}
                                </div>
                                <span className="text-sm text-gray-600">Preview</span>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                {iconOptions.map((iconOption) => {
                                  const IconComponent = iconOption.component;
                                  return (
                                    <button
                                      key={iconOption.id}
                                      type="button"
                                      onClick={() => field.onChange(iconOption.id)}
                                      className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center hover:bg-gray-50 transition-colors ${
                                        field.value === iconOption.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                                      }`}
                                      title={iconOption.label}
                                    >
                                      <IconComponent className="w-6 h-6 text-gray-600" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  "#829B79", "#BD85C8", "#BAC97D", "#FACC7D",
                                  "#8db3d4", "#b68cd4", "#d48ca8", "#90d4c5",
                                  "#d4c590", "#a8d490", "#d490b6", "#90b6d4"
                                ].map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => field.onChange(color)}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                      field.value === color ? "border-gray-800 scale-110" : "border-gray-300"
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <Input
                                type="color"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-full h-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
