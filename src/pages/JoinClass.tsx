import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Validation schema for class code
const classCodeSchema = z.object({
  classCode: z
    .string()
    .min(1, "Class code is required")
    .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .refine(val => val.length === 6, "Class code must be 6 characters")
});

type ClassCodeFormData = z.infer<typeof classCodeSchema>;

export default function JoinClass() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClassCodeFormData>({
    resolver: zodResolver(classCodeSchema),
    defaultValues: {
      classCode: ''
    }
  });

  const onSubmit = async (data: ClassCodeFormData) => {
    setIsLoading(true);
    try {
      // Validate the class code exists
      const response = await apiRequest('GET', `/api/classes/class-code/${data.classCode}`);
      
      if (response) {
        // Class exists, redirect to class island
        setLocation(`/class/${data.classCode}/island`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        toast({
          title: "Class not found",
          description: "Please check your class code and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Unable to join class. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">🏝️</div>
          <CardTitle className="text-2xl font-bold">Join Your Class Island</CardTitle>
          <CardDescription>
            Enter your 6-character class code to visit your class island
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="classCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC-123"
                        className="text-center text-2xl font-mono uppercase"
                        maxLength={7} // Allow for hyphen
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground mt-2">
                      Ask your teacher for your class code
                    </p>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Joining..." : "Visit Class Island"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              First time here? Your teacher will give you a link to take the quiz first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}