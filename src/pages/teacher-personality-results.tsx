import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Brain, Target, BookOpen, Lightbulb } from "lucide-react";
import { PersonalityRadarChart } from "@/components/personality-radar-chart";
import { animalDetails } from "@shared/animal-details";
import { getAnimalTypeFromPersonality } from "@/lib/animals";

// Helper functions for animal display data
function getAnimalImagePath(animal: string): string {
  const imageMap: Record<string, string> = {
    'Meerkat': '/images/meerkat.svg',
    'Panda': '/images/panda.png',
    'Owl': '/images/owl.png',
    'Beaver': '/images/beaver.png',
    'Elephant': '/images/elephant.png',
    'Otter': '/images/otter.png',
    'Parrot': '/images/parrot.png',
    'Border Collie': '/images/collie.png'
  };
  return imageMap[animal] || '/images/kal-character.png';
}

function getAnimalTagline(animal: string): string {
  const taglines: Record<string, string> = {
    'Meerkat': 'Creative & Empathetic - The Imaginative Educator',
    'Panda': 'Reflective & Strategic - The Thoughtful Planner',
    'Owl': 'Analytical & Adaptable - The Wise Mentor',
    'Beaver': 'Reliable & Organized - The Structured Leader',
    'Elephant': 'Caring & Social - The Community Builder',
    'Otter': 'Playful & Energetic - The Dynamic Facilitator',
    'Parrot': 'Enthusiastic & Creative - The Engaging Innovator',
    'Border Collie': 'Leadership & Goal-oriented - The Achievement Coach'
  };
  return taglines[animal] || 'Discover your unique teaching style';
}

function getAnimalDescription(animal: string): string {
  const descriptions: Record<string, string> = {
    'Meerkat': 'You bring creativity and deep empathy to your teaching. Your classroom is a safe space where students feel understood and valued. You excel at connecting with students on an emotional level and fostering authentic self-expression.',
    'Panda': 'Your reflective nature and strategic thinking make you an exceptional planner. You see the big picture and help students understand complex concepts through careful thought and consideration. Your quiet wisdom creates a calm, focused learning environment.',
    'Owl': 'Your analytical mind and adaptability make you a natural problem-solver in the classroom. You excel at breaking down complex topics and adapting your teaching methods to meet diverse learning needs. Students appreciate your logical approach and clear explanations.',
    'Beaver': 'Your reliability and organizational skills create a structured, predictable environment where students thrive. You excel at creating systems and routines that help students feel secure and focused. Your attention to detail ensures no student falls through the cracks.',
    'Elephant': 'Your caring nature and social awareness make you the heart of your school community. You remember every student and create strong bonds that last beyond the classroom. Your collaborative approach brings people together and builds lasting relationships.',
    'Otter': 'Your playful energy and enthusiasm make learning fun and engaging. You bring joy and laughter to the classroom while maintaining high standards. Your dynamic teaching style keeps students motivated and excited about learning.',
    'Parrot': 'Your enthusiasm and creativity light up the classroom. You excel at making learning memorable through innovative approaches and engaging presentations. Your expressive nature helps students connect with material in meaningful ways.',
    'Border Collie': 'Your leadership skills and goal-oriented approach inspire students to reach their full potential. You set high standards and provide the support needed to achieve them. Your focused energy drives classroom success and student achievement.'
  };
  return descriptions[animal] || 'You have a unique teaching style that makes a difference in your students\' lives.';
}

export default function TeacherPersonalityResults() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setLocation("/login");
      return;
    }
    setToken(authToken);
  }, [setLocation]);

  // Fetch teacher profile data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/me"],
    enabled: !!token
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your personality results...</p>
        </div>
      </div>
    );
  }

  if (!user || !(user as any).personalityAnimal || (user as any).personalityAnimal === "not-selected") {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Personality Results</CardTitle>
            <CardDescription>
              You haven't taken the personality quiz yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Discover your teaching personality animal by taking our quiz!</p>
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/account")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Account
              </Button>
              <Button onClick={() => setLocation("/account?tab=profile")}>
                Take the Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const animalType = (user as any).personalityAnimal;
  const animalData = animalDetails[animalType];
  
  if (!animalData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load personality details.</p>
          <Button onClick={() => setLocation("/account")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Button>
        </div>
      </div>
    );
  }

  // Map the animal details data to what we need for display
  const animal = {
    imagePath: getAnimalImagePath(animalType),
    tagline: getAnimalTagline(animalType),
    description: getAnimalDescription(animalType),
    teachingStrengths: animalData.strengths,
    classroomStyle: animalData.teacherTips.slice(0, 3),
    growthAreas: animalData.growthAreas,
    teachingTips: animalData.teacherTips
  };

  // Get the personality type from animal
  const personalityType = Object.entries({
    "INTJ": "Owl",
    "INTP": "Owl",
    "ENTJ": "Border Collie",
    "ENTP": "Otter",
    "INFJ": "Panda",
    "INFP": "Meerkat",
    "ENFJ": "Elephant",
    "ENFP": "Parrot",
    "ISTJ": "Beaver",
    "ISFJ": "Elephant",
    "ESTJ": "Border Collie",
    "ESFJ": "Elephant",
    "ISTP": "Beaver",
    "ISFP": "Meerkat",
    "ESTP": "Otter",
    "ESFP": "Parrot"
  }).find(([_, a]) => a === animalType)?.[0] || "INFP";

  // Mock scores for radar chart (in a real app, these would be calculated from quiz responses)
  const scores = {
    E: personalityType[0] === 'E' ? 75 : 25,
    I: personalityType[0] === 'I' ? 75 : 25,
    S: personalityType[1] === 'S' ? 80 : 20,
    N: personalityType[1] === 'N' ? 80 : 20,
    T: personalityType[2] === 'T' ? 70 : 30,
    F: personalityType[2] === 'F' ? 70 : 30,
    J: personalityType[3] === 'J' ? 65 : 35,
    P: personalityType[3] === 'P' ? 65 : 35
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => setLocation("/account")} 
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Account
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Result Card */}
          <Card className="md:col-span-2 bg-white/95 backdrop-blur shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <img 
                  src={animal.imagePath} 
                  alt={animalType}
                  className="w-24 h-24 object-contain"
                />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Your Teaching Animal: {animalType}
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {animal.tagline}
              </CardDescription>
              <Badge className="mt-2" variant="secondary">{personalityType}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-700">{animal.description}</p>
            </CardContent>
          </Card>

          {/* Personality Chart */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Your Teaching Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalityRadarChart 
                scores={scores}
              />
            </CardContent>
          </Card>

          {/* Teaching Strengths */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Teaching Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {animal.teachingStrengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Classroom Style */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Classroom Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {animal.classroomStyle.map((style, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{style}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Growth Areas */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {animal.growthAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">→</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Teaching Tips */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Teaching Tips for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {animal.teachingTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}