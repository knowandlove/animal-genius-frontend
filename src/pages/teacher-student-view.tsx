import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Users, Heart, Brain, Target, BookOpen, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PersonalityRadarChart } from "@/components/personality-radar-chart";
import { animalDetails } from "@shared/animal-details";

export default function TeacherStudentView() {
  const [, params] = useRoute("/teacher/student/:submissionId");
  const submissionId = params?.submissionId;
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setLocation("/login");
      return;
    }
    setToken(authToken);
  }, [setLocation]);

  // Fetch real submission data
  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: [`/api/submissions/${submissionId}`],
    enabled: !!submissionId && !!token
  });

  // Show loading state
  if (submissionLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p>Student data not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Calculate real data from submission
  const scores = (submission as any).scores || {};
  const learningScores = (submission as any).learningScores || {};
  const studentName = (submission as any).studentName || 'This student';
  
  // Get animal image mapping
  const getAnimalImagePath = (animalName: string): string => {
    const imageMap: Record<string, string> = {
      'Owl': '/images/owl.png',
      'Elephant': '/images/elephant.png', 
      'Otter': '/images/otter.png',
      'Beaver': '/images/beaver.svg',
      'Parrot': '/images/parrot.png',
      'Meerkat': '/images/meerkat.svg',
      'Panda': '/images/panda.png',
      'Border Collie': '/images/collie.png'
    };
    return imageMap[animalName] || '/images/kal-character.png';
  };

  // Calculate energy style from scores
  const energyStyle = scores.E > scores.I 
    ? "Gains energy from being with others" 
    : "Gains energy from quiet reflection";

  // Calculate decision style from scores  
  const decisionStyle = scores.T > scores.F
    ? "Makes decisions based on logic and analysis"
    : "Considers impact on people when deciding";

  // Calculate information processing style
  const infoProcessing = scores.S > scores.N
    ? "Focuses on details and practical information"
    : "Looks for patterns and big picture connections";

  // Calculate structure preference
  const structureStyle = scores.J > scores.P
    ? "Prefers planned, organized approaches"
    : "Likes flexibility and keeping options open";

  const animalName = (submission as any).animalType;
  const animalGenius = (submission as any).animalGenius || "Balanced";
  
  const studentData = {
    name: (submission as any).studentName,
    grade: (submission as any).gradeLevel || "Not specified",
    className: (submission as any).class?.name || "Class",
    animal: {
      imagePath: getAnimalImagePath(animalName),
      name: animalName,
      tagline: `${energyStyle.split(' ')[0]} ${decisionStyle.split(' ')[0]}`,
      genius: animalGenius
    },
    personalityProfile: {
      description: `${animalName}s are known for their ${animalGenius.toLowerCase()} approach to life and learning.`,
      traits: [
        energyStyle,
        decisionStyle,
        infoProcessing,
        structureStyle
      ],
      thinkingStyle: decisionStyle
    },
    learningStyle: {
      primary: (submission as any).learningStyle || "Balanced Learner",
      percentages: {
        visual: learningScores.visual || 0,
        auditory: learningScores.auditory || 0,
        kinesthetic: learningScores.kinesthetic || 0,
        readingWriting: learningScores.readingWriting || 0
      },
      tips: [
        "Benefits from their preferred learning style",
        "Adapts well to different teaching methods",
        "Shows strength in multiple learning areas"
      ]
    },
    collaborationStyle: {
      category: (submission as any).animalGenius || "Balanced",
      description: animalDetails[animalName]?.collaborationTips?.[0] || decisionStyle,
      strengths: animalDetails[animalName]?.collaborationTips?.slice(1) || [
        energyStyle,
        infoProcessing,
        structureStyle
      ],
      bestPairedWith: animalDetails[animalName]?.collaborationTips?.[0]?.includes('pairs well') 
        ? animalDetails[animalName].collaborationTips[0]
        : scores.T > scores.F ? "Feelers for balanced decisions" : "Thinkers for logical analysis"
    },
    preferences: {
      energy: energyStyle,
      processing: infoProcessing,
      decisionMaking: decisionStyle,
      workStyle: structureStyle
    },
    strengths: animalDetails[animalName]?.strengths || [
      "Natural strengths of this animal type",
      "Unique abilities and talents",
      "Areas where they excel naturally",
      "Leadership qualities",
      "Collaboration skills"
    ],
    growthAreas: animalDetails[animalName]?.growthAreas || [
      "Areas for development",
      "Skills to practice",
      "Challenges to work on",
      "Growth opportunities",
      "Learning edges"
    ],
    teacherTips: animalDetails[animalName]?.teacherTips?.map(tip => 
      tip.replace(/them|they|their/gi, (match) => {
        const lower = match.toLowerCase();
        if (lower === 'them') return studentName;
        if (lower === 'they') return studentName;
        if (lower === 'their') return `${studentName}'s`;
        return match;
      })
    ) || [
      `Support strategies for ${studentName}`,
      `Ways to engage ${studentName}'s learning style`,
      "Environmental considerations",
      "Communication approaches",
      "Motivation techniques"
    ]
  };

  const handleBack = () => {
    // Navigate back to analytics or class report based on referrer
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const classId = urlParams.get('classId');
    
    if (from === 'report' && classId) {
      setLocation(`/class-report/${classId}`);
    } else if (classId) {
      setLocation(`/class/${classId}/analytics`);
    } else {
      setLocation('/dashboard');
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Coming Soon",
      description: "PDF export functionality will be available soon!",
    });
  };

  const handleViewMoreStudents = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');
    if (classId) {
      setLocation(`/class/${classId}/analytics`);
    } else {
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-heading text-foreground">{studentData.name}</h1>
                  <p className="font-body text-muted-foreground">
                    {studentData.grade} • {studentData.className}
                  </p>
                </div>
              </div>
              <Button onClick={handleExportPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <Card className="mb-8 bg-gradient-to-r from-orange-100 to-pink-100 border-orange-200">
          <CardContent className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <img 
                src={studentData.animal.imagePath} 
                alt={studentData.animal.name}
                className="w-32 h-32 object-contain"
              />
            </div>
            <h2 className="text-3xl font-heading text-foreground mb-2">{studentData.animal.name}</h2>
            <p className="text-xl font-body text-muted-foreground mb-4">{studentData.animal.tagline}</p>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-orange-200 text-orange-800">
              {studentData.animal.genius}
            </Badge>
          </CardContent>
        </Card>

        {/* Interactive Personality Radar Chart */}
        <div className="mb-8">
          <PersonalityRadarChart 
            scores={scores}
            studentName={studentData.name}
            className="w-full"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Personality Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Heart className="h-5 w-5 text-secondary" />
                Personality Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{studentData.personalityProfile.description}</p>
              <div>
                <h4 className="font-subheading text-foreground mb-2">Key Traits:</h4>
                <ul className="space-y-1">
                  {studentData.personalityProfile.traits.map((trait, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      {trait}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <p className="text-sm font-medium text-secondary-foreground">Thinking Style:</p>
                <p className="text-sm text-secondary-foreground/80">{studentData.personalityProfile.thinkingStyle}</p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <BookOpen className="h-5 w-5 text-primary" />
                How {studentData.name.split(' ')[0]} Learns Best
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-3">
                  Primary Style: <span className="text-primary">{studentData.learningStyle.primary}</span>
                </p>
                <div className="space-y-3">
                  {Object.entries(studentData.learningStyle.percentages).map(([style, percentage]) => (
                    <div key={style} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{style.replace(/([A-Z])/g, '/$1').replace('/', ' ')}</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-subheading text-foreground mb-2">Learning Tips:</h4>
                <ul className="space-y-1">
                  {studentData.learningStyle.tips.map((tip, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Users className="h-5 w-5 text-accent" />
                Working with Others
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="font-medium text-accent-foreground mb-1">{studentData.collaborationStyle.category}</p>
                <p className="text-sm text-accent-foreground/80">{studentData.collaborationStyle.description}</p>
              </div>
              <div>
                <h4 className="font-subheading text-foreground mb-2">Strengths in Groups:</h4>
                <ul className="space-y-1">
                  {studentData.collaborationStyle.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Best Paired With:</p>
                <p className="text-sm text-yellow-700">{studentData.collaborationStyle.bestPairedWith}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Target className="h-5 w-5 text-purple-600" />
                {studentData.name.split(' ')[0]}'s Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Energy:</p>
                  <p className="text-sm text-purple-700">{studentData.preferences.energy}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Processing:</p>
                  <p className="text-sm text-purple-700">{studentData.preferences.processing}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Decision Making:</p>
                  <p className="text-sm text-purple-700">{studentData.preferences.decisionMaking}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Work Style:</p>
                  <p className="text-sm text-purple-700">{studentData.preferences.workStyle}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Growth Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Brain className="h-5 w-5 text-indigo-600" />
                Strengths & Growth Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-subheading text-foreground mb-2 text-green-700">Strengths:</h4>
                <div className="flex flex-wrap gap-2">
                  {studentData.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 border-green-200 text-green-800">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-subheading text-foreground mb-2 text-orange-700">Growth Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  {studentData.growthAreas.map((area, index) => (
                    <Badge key={index} variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What I Wish My Teacher Knew */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                What I Wish My Teacher Knew
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 bg-yellow-50 rounded-lg">
                <Lightbulb className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-yellow-800 font-medium mb-2">Coming Soon!</p>
                <p className="text-yellow-700 text-sm">
                  Personalized insights about this student type will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Tips */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-foreground">Teacher Tips for {studentData.name.split(' ')[0]}</CardTitle>
            <CardDescription>Specific strategies to help this student thrive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {studentData.teacherTips.map((tip, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="sticky bottom-4 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleViewMoreStudents} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              View More Students
            </Button>
            <Button onClick={handleExportPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Student Summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}