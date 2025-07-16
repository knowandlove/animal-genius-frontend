import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TeacherOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
  onOpenQuiz?: () => void;
}

const animalTypes = [
  { id: 'Meerkat', name: 'Meerkat', image: '/images/meerkat.png' },
  { id: 'Panda', name: 'Panda', image: '/images/panda.png' },
  { id: 'Owl', name: 'Owl', image: '/images/owl.png' },
  { id: 'Beaver', name: 'Beaver', image: '/images/beaver.png' },
  { id: 'Elephant', name: 'Elephant', image: '/images/elephant.png' },
  { id: 'Otter', name: 'Otter', image: '/images/otter.png' },
  { id: 'Parrot', name: 'Parrot', image: '/images/parrot.png' },
  { id: 'Border Collie', name: 'Border Collie', image: '/images/collie.png' }
];

export function TeacherOnboardingModal({ isOpen, onClose, teacherName = "Teacher", onOpenQuiz }: TeacherOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Mutation to update teacher's animal type
  const updateAnimalMutation = useMutation({
    mutationFn: async (animalType: string) => {
      return apiRequest('PUT', '/api/me/profile', { personalityAnimal: animalType });
    },
    onSuccess: async () => {
      // Refresh user data to reflect the new animal
      if (refreshUser) {
        await refreshUser();
      }
      // Invalidate the /api/me query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
      toast({
        title: "Animal type saved!",
        description: "Your personality animal has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save animal type. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep === 1 && selectedAnimal) {
      // Save the selected animal
      updateAnimalMutation.mutate(selectedAnimal);
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTakeQuiz = () => {
    // Close onboarding modal and trigger the quiz modal
    onClose();
    // We'll pass a callback to open the quiz
    if (onOpenQuiz) {
      onOpenQuiz();
    }
  };

  const handleSkip = () => {
    // Skip to the next step
    setCurrentStep(currentStep + 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        // Welcome screen
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to Animal Genius, {teacherName}!
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              We're thrilled to have you join our community of educators bringing personality-based learning to life.
            </p>
            <p className="text-gray-500">
              Let's get you set up in just a few quick steps!
            </p>
          </div>
        );

      case 1:
        // Animal selection screen
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What's Your Animal Personality?
              </h2>
              <p className="text-gray-600">
                Every teacher has a unique personality type. Do you already know yours?
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 font-medium text-center">
                Select your animal type:
              </p>
              <div className="grid grid-cols-4 gap-3">
                {animalTypes.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                      selectedAnimal === animal.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={animal.image} 
                      alt={animal.name}
                      className="w-16 h-16 object-contain mb-1"
                      onError={(e) => {
                        e.currentTarget.src = '/images/kal-character.png';
                      }}
                    />
                    <div className="text-xs font-medium text-center">{animal.name}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center space-y-3 pt-4">
                <p className="text-sm text-gray-600">Not sure? No problem!</p>
                <Button
                  variant="outline"
                  onClick={handleTakeQuiz}
                  className="w-full max-w-xs"
                >
                  Take the Quiz to Find Out
                </Button>
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        // Create first class prompt
        return (
          <div className="text-center space-y-6">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create Your First Class
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Ready to bring Animal Genius to your students? Start by creating your first class. 
              You'll get a unique class code that students will use to join.
            </p>
            <div className="bg-primary/5 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm text-gray-700">
                <strong>Pro tip:</strong> You can create multiple classes for different groups or subjects!
              </p>
            </div>
          </div>
        );

      case 3:
        // Feedback reminder
        return (
          <div className="text-center space-y-6">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-900">
              We'd Love Your Feedback!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              As we continue to improve Animal Genius, your insights are invaluable. 
              You can always share your thoughts and suggestions with us.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm text-blue-800">
                Find the <strong>Feedback</strong> option in the menu under your account name 
                in the upper right corner.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Let's make Animal Genius amazing together! 🌟
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center space-x-2">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-colors ${
                  step === currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={currentStep === 1 && !selectedAnimal && !updateAnimalMutation.isPending}
            className="flex items-center gap-1"
          >
            {currentStep === 3 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}