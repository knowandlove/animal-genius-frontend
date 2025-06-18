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
import { Link } from 'wouter';
// Removed icon imports to optimize build performance
import confetti from 'canvas-confetti';
import { QuizProgressTimeline } from '@/components/quiz-progress-timeline';
import { KalCharacter } from '@/components/KalCharacter';
import { KalSidebar } from '@/components/KalSidebar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ANIMAL_TYPES } from '@/lib/animals';

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
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [kalMessage, setKalMessage] = useState("Welcome! I'm KAL, and I'm here to cheer you on!");
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [showStudentInfo, setShowStudentInfo] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null); // MOVED UP HERE
  const { toast } = useToast();
  
  // Handle submission data updates
  useEffect(() => {
    if (submitResultsMutation.isSuccess && submitResultsMutation.data) {
      setSubmissionData(submitResultsMutation.data);
    }
  }, [submitResultsMutation.isSuccess, submitResultsMutation.data]);

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
        if (parsed.gradeLevel) setGradeLevel(parsed.gradeLevel);
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
          setKalMessage("Welcome back! I've saved your progress. Let's continue where you left off!");
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
        gradeLevel,
        showStudentInfo,
        hasSubmitted,
        quizComplete,
        results
      };
      localStorage.setItem(`quiz-state-${classCode}`, JSON.stringify(state));
    }
  }, [currentQuestion, answers, answeredQuestions, firstName, lastInitial, gradeLevel, showStudentInfo, hasSubmitted, quizComplete, results, classCode]);

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
  const { data: classInfo, isLoading: classLoading } = useQuery<ClassInfo>({
    queryKey: [`/api/classes/code/${classCode}`],
    enabled: !!classCode,
  });

  // Submit quiz results
  const submitResultsMutation = useMutation({
    mutationFn: async (submissionData: { studentName: string; gradeLevel: string; classId: number; scores: any; personalityType: string; animalType: string }) => {
      // Validate submission data
      if (!submissionData.studentName?.trim()) {
        throw new Error("Student name is required");
      }
      if (!submissionData.gradeLevel?.trim()) {
        throw new Error("Grade level is required");
      }
      if (!submissionData.classId) {
        throw new Error("Class ID is required");
      }
      
      return apiRequest('POST', '/api/quiz-submissions', submissionData);
    },
    onSuccess: (data) => {
      console.log('Quiz submission response:', data);
      
      // Invalidate relevant caches so teachers see new results immediately
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      // Clear saved quiz state after successful submission
      if (classCode) {
        localStorage.removeItem(`quiz-state-${classCode}`);
      }
      
      // Store quiz results for display on next page
      const quizResultsData = {
        studentName: `${firstName} ${lastInitial}.`,
        gradeLevel,
        animalType: results?.animal || '',
        personalityType: results?.mbtiType || '',
        scores: results?.scores,
        learningStyle: results?.learningStyle,
        learningScores: results?.learningScores,
        ...data // Include any data from server response
      };
      
      toast({
        title: "Quiz completed! 🎉",
        description: "Your results have been saved successfully.",
      });

      // Check response for passport code or ID
      if (data && data.passportCode) {
        console.log('Received passport code:', data.passportCode);
        
        // Store results for the island welcome page
        sessionStorage.setItem('quizResults', JSON.stringify(quizResultsData));
        
        // Show success message with passport code
        toast({
          title: "Your Passport Code",
          description: `${data.passportCode} - Save this to visit your island anytime!`,
        });
        
        // Redirect to island after a short delay
        setTimeout(() => {
          setLocation(`/island/${data.passportCode}`);
        }, 2000);
      } else if (data && data.id) {
        // If we only have an ID, try the results page
        console.log('No passport code in response, trying results page with ID:', data.id);
        
        // Store results for the results page
        sessionStorage.setItem('quizResults', JSON.stringify(quizResultsData));
        
        setTimeout(() => {
          setLocation(`/results/${data.id}`);
        }, 1500);
      } else {
        // If no passport code or ID, show error but keep user on completion screen
        console.error('Incomplete response from server:', data);
        toast({
          title: "⚠️ Important",
          description: "Your results were saved, but no passport code was generated. Please ask your teacher for your passport code to access your island.",
          variant: "destructive",
        });
      }
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
      setKalMessage(messages[currentQuestion + 1] || "Keep going!");
      
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
      const quizResults = calculateResults(updatedAnswers);
      setResults(quizResults);
      setQuizComplete(true);
      setKalMessage(`Congratulations! You're a ${quizResults.animal}! 🎊`);
      
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
      
      setKalMessage(encouragements[Math.floor(Math.random() * encouragements.length)]);
    }
  };

  const handleStartQuiz = () => {
    if (!firstName.trim() || !lastInitial.trim() || !gradeLevel.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your first name, last initial, and grade level.",
        variant: "destructive",
      });
      return;
    }
    setShowStudentInfo(false);
    setKalMessage("Let's discover your amazing personality! Answer honestly - there are no wrong answers!");
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
      
      // Update KAL message based on navigation
      if (answeredQuestions.includes(questionIndex)) {
        setKalMessage("Reviewing your answer - great job!");
      } else {
        setKalMessage("Let's tackle this question together!");
      }
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

    const studentName = `${firstName} ${lastInitial}.`;
    const submissionData = {
      classId: classInfo?.id || 0,
      studentName,
      gradeLevel,
      answers, // Include raw answers for audit trail
      personalityType: results?.mbtiType || '', // Map mbtiType to personalityType for database
      animalType: results?.animal || '',
      scores: results?.scores || { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
      learningStyle: results?.learningStyle || 'visual',
      learningScores: results?.learningScores || { visual: 0, auditory: 0, kinesthetic: 0, readingWriting: 0 },
    };

    console.log('Submitting quiz data:', submissionData);
    setHasSubmitted(true);
    submitResultsMutation.mutate(submissionData);
  };

  // Play audio narration
  const playAudio = () => {

    // In real implementation: new Audio(`/audio/${question.audioFile}`).play();
  };

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
            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium mb-1">
                Grade Level
              </label>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select your grade</option>
                <option value="6th Grade">6th Grade</option>
                <option value="7th Grade">7th Grade</option>
                <option value="8th Grade">8th Grade</option>
                <option value="9th Grade">9th Grade</option>
              </select>
            </div>
            <Button onClick={handleStartQuiz} className="w-full">
              Start Quiz
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
    setKalMessage("Welcome back! Let's discover your amazing personality again!");
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
    // Map correct animal emojis for your 8 animals
    const animal = ANIMAL_TYPES[results.animal] || {
      name: results.animal,
      imagePath: "/images/default-animal.svg",
      description: `You have the personality traits of a ${results.animal}!`,
      traits: [],
      emoji: '🐾'
    };
    
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen" style={{
        background: 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)'
      }}>
        <KalCharacter 
          message={`You're a ${results.animal}! ${animal.description}`} 
          mood="celebrating" 
        />
        
        <Card className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="mb-4 flex justify-center">
              <img 
                src={animal.imagePath} 
                alt={animal.name}
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-4xl font-heading text-foreground mb-2">You're a {results.animal}!</h1>
            <p className="text-xl font-body text-muted-foreground mb-4">{animal.traits}</p>
            <p className="text-lg font-body mb-6">{animal.description}</p>
            
            {/* Show passport code if already received */}
            {submissionData?.passportCode && (
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Your Island Passport Code:</h3>
                <div className="text-3xl font-mono font-bold text-green-900">
                  {submissionData.passportCode}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Save this code! You'll need it to visit your island.
                </p>
                <Button 
                  onClick={() => setLocation(`/island/${submissionData.passportCode}`)}
                  className="mt-3 bg-green-600 hover:bg-green-700"
                >
                  🏝️ Visit Your Island Now
                </Button>
              </div>
            )}
            
            <div className="bg-muted rounded-lg p-4 mb-6">
              <h3 className="font-subheading text-foreground mb-2">Your Personality Type: {results.mbtiType}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div>Extroversion: {results.scores.E} | Introversion: {results.scores.I}</div>
                <div>Sensing: {results.scores.S} | Intuition: {results.scores.N}</div>
                <div>Thinking: {results.scores.T} | Feeling: {results.scores.F}</div>
                <div>Judging: {results.scores.J} | Perceiving: {results.scores.P}</div>
              </div>
            </div>
            
            {results.learningStyle && (
              <div className="bg-mint border border-dark-mint rounded-lg p-4 mb-4">
                <p className="text-sm font-body text-foreground">
                  <strong>Learning Style:</strong> {results.learningStyle === 'readingWriting' ? 'Reading/Writing' : 
                    results.learningStyle.charAt(0).toUpperCase() + results.learningStyle.slice(1)}
                </p>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.print()}>
                Print My Results
              </Button>
              <Button 
                onClick={handleSubmitResults}
                disabled={submitResultsMutation.isPending || hasSubmitted}
                variant={hasSubmitted ? "secondary" : "default"}
              >
                {submitResultsMutation.isPending ? 'Saving...' : hasSubmitted ? 'Results Saved' : 'Save My Results'}
              </Button>
              <Button variant="outline" onClick={resetQuiz}>
                Take Quiz Again
              </Button>
            </div>
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
      {/* Main content area with KAL and quiz side by side */}
      <div className="flex items-stretch gap-8 w-full max-w-5xl">
        {/* KAL on the left */}
        <KalSidebar 
          message={kalMessage}
          questionProgress={currentQuestion + 1}
          totalQuestions={questions.length}
        />
        
        {/* Quiz content on the right */}
        <div className="flex-1">
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
            </Button>
            
            <Button
              variant="outline"
              onClick={playAudio}
              className="px-6 py-2 flex items-center gap-2"
            >
              🔊 Listen to Question
            </Button>
          </div>
        </motion.div>
      </Card>
        </div>
      </div>
    </div>
  );
}