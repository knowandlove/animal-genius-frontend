import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { questions } from '@shared/quiz-questions';
import { calculateResults, type QuizAnswer, type QuizResults } from '@shared/scoring';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { submitQuiz, checkQuizEligibility } from '@/lib/edge-functions/client';
import { storePassportCode, storeStudentData } from '@/lib/passport-auth';
import { Link } from 'wouter';
import { FileText, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizProgressTimeline } from '@/components/quiz-progress-timeline';
import { KalCharacter } from '@/components/KalCharacter';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ANIMAL_TYPES } from '@/lib/animals';
import { ServerAvatar } from '@/components/avatar/ServerAvatar';

interface ClassInfo {
  id: number;
  name: string;
  code: string;
  teacherName: string;
}



export default function StudentQuiz() {
  const [, params] = useRoute('/q/:classCode');
  const [, setLocation] = useLocation();
  const classCode = params?.classCode;
  
  console.log('StudentQuiz - classCode from params:', classCode);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [showStudentInfo, setShowStudentInfo] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const { toast } = useToast();

  // Persist quiz state to localStorage to prevent data loss on accidental refresh
  useEffect(() => {
    const savedState = localStorage.getItem(`quiz-state-${classCode}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.currentQuestion !== undefined) setCurrentQuestion(parsed.currentQuestion);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.answeredQuestions) setAnsweredQuestions(parsed.answeredQuestions);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastInitial) setLastInitial(parsed.lastInitial);
        if (parsed.showStudentInfo !== undefined) setShowStudentInfo(parsed.showStudentInfo);
        if (parsed.hasSubmitted !== undefined) setHasSubmitted(parsed.hasSubmitted);
        if (parsed.quizComplete !== undefined) setQuizComplete(parsed.quizComplete);
        if (parsed.results) setResults(parsed.results);
        
        // Show recovery message if quiz was in progress
        if (parsed.answers && parsed.answers.length > 0) {
          toast({
            title: "Quiz Restored",
            description: `Welcome back! Your progress has been saved. You're on question ${parsed.currentQuestion + 1}.`,
          });
        }
      } catch (e) {
        console.warn('Failed to restore quiz state:', e);
      }
    }
  }, [classCode, toast]);

  // Save quiz state to localStorage whenever it changes
  useEffect(() => {
    if (classCode) {
      const state = {
        currentQuestion,
        answers,
        answeredQuestions,
        firstName,
        lastInitial,
        showStudentInfo,
        hasSubmitted,
        quizComplete,
        results
      };
      localStorage.setItem(`quiz-state-${classCode}`, JSON.stringify(state));
    }
  }, [currentQuestion, answers, answeredQuestions, firstName, lastInitial, showStudentInfo, hasSubmitted, quizComplete, results, classCode]);

  // Handle keyboard shortcuts for answer selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only work during active quiz (not on student info screen or results)
      if (showStudentInfo || quizComplete) return;
      
      const question = questions[currentQuestion];
      const isVARK = question.dimension === 'VARK';
      
      // Number keys 1-4 or A-D keys
      if (e.key === '1' || e.key.toLowerCase() === 'a') {
        handleAnswerSelect('A');
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        handleAnswerSelect('B');
      } else if ((e.key === '3' || e.key.toLowerCase() === 'c') && isVARK && question.options.C) {
        handleAnswerSelect('C');
      } else if ((e.key === '4' || e.key.toLowerCase() === 'd') && isVARK && question.options.D) {
        handleAnswerSelect('D');
      } else if (e.key === 'Enter' && selectedAnswer) {
        // Enter key submits current answer
        handleSubmitAnswer();
      } else if (e.key === 'ArrowLeft' && currentQuestion > 0 && answeredQuestions.includes(currentQuestion - 1)) {
        // Left arrow goes to previous answered question
        handleTimelineNavigation(currentQuestion - 1);
      } else if (e.key === 'ArrowRight' && answeredQuestions.includes(currentQuestion + 1)) {
        // Right arrow goes to next answered question
        handleTimelineNavigation(currentQuestion + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, selectedAnswer, showStudentInfo, quizComplete, answeredQuestions]);

  // Prevent accidental page navigation/refresh during quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizComplete && answers.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5 refresh and Ctrl+R during quiz
      if ((e.key === 'F5' || (e.ctrlKey && e.key === 'r')) && !quizComplete) {
        e.preventDefault();
        toast({
          title: "Quiz in progress",
          description: "Please complete the quiz before refreshing the page.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizComplete, answers.length, toast]);

  // Get class information
  const { data: classInfo, isLoading: classLoading, error: classError } = useQuery<ClassInfo>({
    queryKey: [`/api/classes/class-code/${classCode}`],
    enabled: !!classCode,
  });

  // Submit quiz results
  const submitResultsMutation = useMutation({
    mutationFn: async () => {
      // Validate submission data
      if (!firstName.trim() || !lastInitial.trim()) {
        throw new Error("Name is required");
      }
      if (!classCode) {
        throw new Error("Class code is required");
      }
      if (answers.length < questions.length) {
        throw new Error(`Please answer all ${questions.length} questions. You've answered ${answers.length}.`);
      }
      
      // Convert answers array to object format for Edge Function
      const answersObj: Record<string, 'A' | 'B' | 'C' | 'D'> = {};
      answers.forEach((answer) => {
        answersObj[`q${answer.questionId}`] = answer.answer;
      });
      
      console.log('Submitting quiz with data:', {
        classCode,
        firstName,
        lastInitial,
        answersCount: Object.keys(answersObj).length,
        answers: answersObj
      });
      
      // Call Edge Function
      return submitQuiz({
        classCode,
        firstName,
        lastInitial,
        answers: answersObj,
      });
    },
    onSuccess: (data) => {
      console.log('Quiz submission response:', data);
      
      // Clear saved quiz state after successful submission
      if (classCode) {
        localStorage.removeItem(`quiz-state-${classCode}`);
      }
      
      // Store passport code and student data
      if (data.passportCode) {
        storePassportCode(data.passportCode);
        storeStudentData({
          id: data.studentId || '',
          name: `${data.firstName} ${lastInitial}.`,
          animalType: data.animalType,
          geniusType: results?.animalGenius || '',
          classId: classInfo?.id?.toString() || '',
          passportCode: data.passportCode,
        });
      }
      
      // Store quiz results for display
      // FIX: Use backend calculation for both animal AND personality to ensure consistency
      const quizResultsData = {
        studentName: `${data.firstName} ${lastInitial}.`,
        animalType: data.animalType,
        personalityType: data.mbtiType || results?.mbtiType || '', // Use backend first, frontend fallback
        scores: results?.scores,
        learningStyle: results?.learningStyle,
        learningScores: results?.learningScores,
        passportCode: data.passportCode,
      };
      
      sessionStorage.setItem('quizResults', JSON.stringify(quizResultsData));
      
      // Update submission data state
      setSubmissionData(data);
      
      toast({
        title: "Quiz completed! 🎉",
        description: data.message || "Your results have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save quiz results. Please try again.",
        variant: "destructive",
      });
      console.error('Submit error:', error);
    },
  });

  // Handle submission data updates
  useEffect(() => {
    if (submitResultsMutation.isSuccess && submitResultsMutation.data) {
      setSubmissionData(submitResultsMutation.data);
    }
  }, [submitResultsMutation.isSuccess, submitResultsMutation.data]);

  // Milestone celebrations
  useEffect(() => {
    if ([10, 20, 30].includes(currentQuestion + 1)) {
      setShowCelebration(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const messages: Record<number, string> = {
        10: "Awesome job! You're crushing it! 🎉",
        20: "Halfway there! You're doing amazing! 🌟",
        30: "Final stretch! You're almost done! 🚀"
      };
      
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [currentQuestion]);

  // Handle answer selection (just set selected answer, don't auto-progress)
  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(answer);
  };

  // Handle submitting the current answer
  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const questionId = questions[currentQuestion].id;
    const newAnswer: QuizAnswer = {
      questionId,
      answer: selectedAnswer
    };
    
    // Remove any existing answer for this question to prevent duplicates
    const filteredAnswers = answers.filter(a => a.questionId !== questionId);
    const updatedAnswers = [...filteredAnswers, newAnswer];
    
    setAnswers(updatedAnswers);
    setAnsweredQuestions(prev => {
      if (!prev.includes(currentQuestion)) {
        return [...prev, currentQuestion];
      }
      return prev;
    }); // Track answered questions (avoid duplicates)
    setSelectedAnswer(null); // Reset selection for next question

    if (currentQuestion === questions.length - 1) {
      // Calculate results
      console.log('Quiz complete! Total answers:', updatedAnswers.length);
      const quizResults = calculateResults(updatedAnswers);
      setResults(quizResults);
      setQuizComplete(true);
      
      // Big celebration for completion
      confetti({
        particleCount: 200,
        spread: 180
      });
    } else {
      // Move to next question
      setCurrentQuestion(currentQuestion + 1);
      
      // Update messages based on progress
      const progress = (currentQuestion + 1) / questions.length;
      let encouragements: string[];
      
      if (progress < 0.25) {
        encouragements = [
          "Great start! Keep going!",
          "You're doing awesome!",
          "Nice choice! On to the next!",
          "Excellent! Keep it up!",
          "Perfect! You've got this!"
        ];
      } else if (progress < 0.5) {
        encouragements = [
          "You're halfway there!",
          "Amazing progress!",
          "Keep up the great work!",
          "You're on fire!",
          "Wonderful job so far!"
        ];
      } else if (progress < 0.75) {
        encouragements = [
          "Almost there! Don't stop now!",
          "You're crushing it!",
          "The finish line is in sight!",
          "Incredible progress!",
          "You're doing fantastic!"
        ];
      } else {
        encouragements = [
          "Final stretch! You've got this!",
          "Just a few more questions!",
          "You're almost done!",
          "Home stretch - keep going!",
          "Nearly there, superstar!"
        ];
      }
      
    }
  };

  const handleStartQuiz = async () => {
    if (!firstName.trim() || !lastInitial.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your first name and last initial.",
        variant: "destructive",
      });
      return;
    }

    // Check quiz eligibility before starting
    setCheckingEligibility(true);
    try {
      const eligibility = await checkQuizEligibility(classCode!, firstName.trim(), lastInitial.trim());
      
      if (!eligibility.eligible) {
        let errorMessage = eligibility.message;
        if (eligibility.suggestion) {
          errorMessage += ` ${eligibility.suggestion}`;
        }
        
        toast({
          title: "Cannot Start Quiz",
          description: errorMessage,
          variant: "destructive",
        });
        setCheckingEligibility(false);
        return;
      }
      
      // Show class info if eligible
      if (eligibility.classInfo) {
        toast({
          title: "Welcome!",
          description: `Joining ${eligibility.classInfo.name} (${eligibility.classInfo.currentStudents}/${eligibility.classInfo.maxStudents} students)`,
        });
      }
      
      setCheckingEligibility(false);
      setShowStudentInfo(false);
    } catch (error) {
      setCheckingEligibility(false);
      toast({
        title: "Error",
        description: "Failed to check quiz eligibility. Please try again.",
        variant: "destructive",
      });
      console.error('Eligibility check error:', error);
    }
  };

  // Handle timeline navigation
  const handleTimelineNavigation = (questionIndex: number) => {
    // Only allow navigation to answered questions or the next available question
    const maxAnswered = answeredQuestions.length > 0 ? Math.max(...answeredQuestions) : -1;
    if (answeredQuestions.includes(questionIndex) || questionIndex <= maxAnswered + 1) {
      setCurrentQuestion(questionIndex);
      
      // Restore the previously selected answer if this question was answered
      const questionId = questions[questionIndex].id;
      const existingAnswer = answers.find(a => a.questionId === questionId);
      setSelectedAnswer(existingAnswer?.answer || null);
      
    }
  };

  const handleSubmitResults = () => {
    // Prevent multiple submissions
    if (hasSubmitted || submitResultsMutation.isPending) {
      toast({
        title: "Already Submitted",
        description: "Your quiz results have already been saved.",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting quiz via Edge Function');
    setHasSubmitted(true);
    submitResultsMutation.mutate();
  };

  // Play audio narration
  const playAudio = () => {

    // In real implementation: new Audio(`/audio/${question.audioFile}`).play();
  };

  // Auto-save results when quiz is completed
  useEffect(() => {
    if (quizComplete && results && !hasSubmitted && !submitResultsMutation.isPending) {
      console.log('Auto-saving quiz results...');
      console.log('Total answers:', answers.length, 'Total questions:', questions.length);
      if (answers.length === questions.length) {
        submitResultsMutation.mutate();
        setHasSubmitted(true);
      } else {
        console.warn('Not all questions answered, skipping auto-submit');
      }
    }
  }, [quizComplete, results, hasSubmitted, submitResultsMutation, answers.length, questions.length]);

  if (classLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-heading text-foreground mb-2">Loading quiz...</h2>
          <p className="font-body text-muted-foreground">Please wait while we prepare your personality quiz.</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center main-bg">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
            <CardDescription>
              We couldn't find a quiz with that class code. Please check the code and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showStudentInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center main-bg">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="flex flex-col leading-tight">
                <div className="text-sm font-display text-foreground/80">know & love™</div>
                <div className="text-2xl font-heading text-foreground font-bold">Animal Genius</div>
                <div className="text-base font-body text-foreground/70">Leadership Assessment</div>
              </div>
            </CardTitle>
            <CardDescription className="font-body">
              Welcome to {(classInfo as ClassInfo)?.name}! Let's discover your animal personality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label htmlFor="lastInitial" className="block text-sm font-medium mb-1">
                  Last Initial
                </label>
                <input
                  id="lastInitial"
                  type="text"
                  value={lastInitial}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 1 && /^[A-Z]*$/.test(value)) {
                      setLastInitial(value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center"
                  placeholder="X"
                  maxLength={1}
                />
              </div>
            </div>
            <Button 
              onClick={handleStartQuiz} 
              className="w-full"
              disabled={checkingEligibility}
            >
              {checkingEligibility ? 'Checking eligibility...' : 'Start Quiz'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset quiz function for better UX
  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizComplete(false);
    setResults(null);
    setShowCelebration(false);
    // Keep student info since it's likely the same student
    setShowStudentInfo(false); // Skip info screen on retry
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
    setHasSubmitted(false);
    setSubmissionData(null);
    submitResultsMutation.reset(); // Reset mutation state
    
    // Clear saved quiz state
    if (classCode) {
      localStorage.removeItem(`quiz-state-${classCode}`);
    }
  };

  // Show results page
  if (quizComplete && results) {
    // Use the backend animal type if available (from submission response), otherwise fall back to frontend
    const animalType = submissionData?.animalType || results.animal;
    
    // Map animal names to their file names for Supabase storage
    const animalFileMap: Record<string, string> = {
      'meerkat': 'meerkat',
      'panda': 'panda', 
      'owl': 'owl',
      'beaver': 'beaver',
      'elephant': 'elephant',
      'otter': 'otter',
      'parrot': 'parrot',
      'border collie': 'border_collie',
      'collie': 'border_collie'  // Handle both variations
    };
    
    const animalFileName = animalFileMap[animalType.toLowerCase()] || animalType.toLowerCase();
    const animalHeadUrl = `https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/public-assets/animals/head_icons/${animalFileName}.png`;
    
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen" style={{
        background: 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)'
      }}>
        
        <Card className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Large animal head icon from Supabase - no circle */}
            <div className="mb-8 flex justify-center">
              <img
                src={animalHeadUrl}
                alt={`${animalType} head`}
                className="w-56 h-56 object-contain drop-shadow-xl"
                onError={(e) => {
                  // Fallback if image fails - show large letter
                  const imgElement = e.target as HTMLImageElement;
                  const container = imgElement.parentElement;
                  if (container) {
                    container.innerHTML = `<div class="w-56 h-56 flex items-center justify-center"><span class="text-8xl font-bold text-primary">${animalType.charAt(0).toUpperCase()}</span></div>`;
                  }
                }}
              />
            </div>
            
            {/* Main message - smaller intro text, bigger animal name */}
            <h1 className="font-heading text-foreground mb-8">
              <span className="text-xl block mb-2">We think you're a...</span>
              <span className="text-6xl font-bold block text-primary">{animalType.toUpperCase()}!</span>
            </h1>
            
            {/* Action buttons container - stacked with colorful styles */}
            <div className="space-y-4 mb-8 max-w-sm mx-auto">
              {/* Read full results button - primary action */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-5 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-3"
                onClick={() => {
                  // Redirect to external knowandlove.com with the animal result
                  const externalUrl = `https://knowandlove.com/${animalType.toLowerCase().replace(/\s+/g, '-')}-result`;
                  window.open(externalUrl, '_blank');
                }}
              >
                <FileText className="w-5 h-5" />
                <span>Read My Full Results</span>
              </motion.button>
              
              {/* Go to dashboard button - secondary action */}
              {submissionData?.passportCode && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center gap-3"
                  onClick={() => setLocation('/student/dashboard')}
                >
                  <Home className="w-5 h-5" />
                  <span>Go to My Dashboard</span>
                </motion.button>
              )}
            </div>
            
            {/* Passport code box with better styling */}
            {submissionData?.passportCode && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-2xl p-6 max-w-md mx-auto shadow-md"
              >
                <h3 className="font-bold text-orange-800 mb-3 text-lg">
                  Your Passport Code
                </h3>
                <div className="bg-white rounded-xl px-4 py-3 shadow-inner">
                  <div className="text-3xl font-mono font-bold text-orange-600 tracking-wider">
                    {submissionData.passportCode}
                  </div>
                </div>
                <p className="text-sm text-orange-700 mt-3 font-medium">
                  Save this code! You'll need it to log back in.
                </p>
              </motion.div>
            )}
          </motion.div>
        </Card>
      </div>
    );
  }

  // Show current question
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 main-bg">
      {/* Main content area - centered without KAL */}
      <div className="w-full max-w-3xl">
          {/* Progress Timeline - same width as card */}
          <div className="mb-6">
            <QuizProgressTimeline
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={answeredQuestions}
              milestoneQuestions={[10, 20, 30]}
              onQuestionClick={handleTimelineNavigation}
              allowNavigation={true}
            />
          </div>
          
          <Card className="p-8">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-heading text-foreground mb-8 text-center">
            {question.text}
          </h2>
          
          <div className="grid gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect('A')}
              className={`p-6 text-left rounded-lg border-2 transition-all font-body ${
                selectedAnswer === 'A' 
                  ? 'border-primary bg-soft-lime/20' 
                  : 'border-border hover:border-primary hover:bg-soft-lime/10'
              }`}
            >
              <span className="font-medium text-primary mr-2">A.</span>
              {question.options.A}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect('B')}
              className={`p-6 text-left rounded-lg border-2 transition-all font-body ${
                selectedAnswer === 'B' 
                  ? 'border-secondary bg-dark-mint/20' 
                  : 'border-border hover:border-secondary hover:bg-dark-mint/10'
              }`}
            >
              <span className="font-medium text-secondary mr-2">B.</span>
              {question.options.B}
            </motion.button>

            {/* Show C and D options for VARK questions */}
            {question.dimension === 'VARK' && question.options.C && question.options.D && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerSelect('C')}
                  className={`p-6 text-left rounded-lg border-2 transition-all font-body ${
                    selectedAnswer === 'C' 
                      ? 'border-accent bg-orange/20' 
                      : 'border-border hover:border-accent hover:bg-orange/10'
                  }`}
                >
                  <span className="font-medium text-accent mr-2">C.</span>
                  {question.options.C}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerSelect('D')}
                  className={`p-6 text-left rounded-lg border-2 transition-all font-body ${
                    selectedAnswer === 'D' 
                      ? 'border-yellow bg-yellow/20' 
                      : 'border-border hover:border-yellow hover:bg-yellow/10'
                  }`}
                >
                  <span className="font-medium text-yellow mr-2">D.</span>
                  {question.options.D}
                </motion.button>
              </>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="px-8 py-2"
            >
              Submit Answer
              <span className="ml-2 text-xs opacity-70">(Enter)</span>
            </Button>
            
            {/* Audio Button - TEMPORARILY DISABLED FOR DEMO */}
            {/* <Button
              variant="outline"
              onClick={playAudio}
              className="px-6 py-2 flex items-center gap-2"
            >
              🔊 Listen to Question
            </Button> */}
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>💡 Tip: Use number keys 1-4 or letters A-D to select answers</p>
          </div>
        </motion.div>
      </Card>
      </div>
    </div>
  );
}