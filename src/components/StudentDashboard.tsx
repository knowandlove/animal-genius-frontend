import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, GraduationCap, Sparkles, Users } from 'lucide-react';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { getClassInfo, getStudentProgress, getClassmates } from '@/lib/passport-auth';

export function StudentDashboard() {
  const { student, logout, isLoading } = useStudentAuth();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      if (!student) return;

      setDataLoading(true);
      try {
        const [classData, progressData, classmatesData] = await Promise.all([
          getClassInfo(),
          getStudentProgress(),
          getClassmates()
        ]);

        setClassInfo(classData);
        setProgress(progressData);
        setClassmates(classmatesData);
      } catch (error) {
        console.error('Failed to load student data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadStudentData();
  }, [student]);

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {student.name}! 🎉</h1>
            <p className="text-muted-foreground">Your passport code: {student.passportCode}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Student Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {student.animalType} Personality
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {student.geniusType} Genius
              </Badge>
              <Badge variant="outline">
                Grade {student.schoolYear}
              </Badge>
            </div>

            {progress && (
              <div className="pt-4">
                <h4 className="font-medium mb-2">Quiz Results</h4>
                <p className="text-sm text-muted-foreground">
                  Animal Type: {progress.animalType} • 
                  Completed: {new Date(progress.completedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Information */}
        {classInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Your Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{classInfo.name}</h3>
                <p className="text-muted-foreground">{classInfo.subject} • {classInfo.gradeLevel}</p>
                <p className="text-sm">
                  {classInfo.studentCount} students in your class
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classmates */}
        {classmates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Classmates ({classmates.length})
              </CardTitle>
              <CardDescription>
                See who else has completed the Animal Genius Quiz!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classmates.map((classmate, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium">{classmate.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {classmate.animalType}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(classmate.joinedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading States */}
        {dataLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading your data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation to Room */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Ready to explore?</h3>
              <p className="text-muted-foreground">
                Visit your personalized room to customize your avatar and interact with classmates!
              </p>
              <Button size="lg" className="w-full max-w-xs">
                Enter My Room 🏠
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}