import { useState } from 'react';
import { PlayCircle, Users, GraduationCap, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VimeoPlayerProps {
  teacherVideoId?: string;
  studentVideoId?: string;
  lessonTitle: string;
  className?: string;
}

export function VimeoPlayer({ 
  teacherVideoId, 
  studentVideoId, 
  lessonTitle,
  className = "" 
}: VimeoPlayerProps) {
  const [activeVideo, setActiveVideo] = useState<'teacher' | 'student'>('teacher');
  
  // If only one video is available, show that one
  const hasTeacherVideo = !!teacherVideoId;
  const hasStudentVideo = !!studentVideoId;
  
  if (!hasTeacherVideo && !hasStudentVideo) {
    // Show placeholder if no videos
    return (
      <Card className={`border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Lesson Overview Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <PlayCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Video Coming Soon</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{lessonTitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const currentVideoId = activeVideo === 'teacher' ? teacherVideoId : studentVideoId;
  const showToggle = hasTeacherVideo && hasStudentVideo;
  
  return (
    <Card className={`border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Lesson Overview Video
          </CardTitle>
          
          {showToggle && (
            <div className="flex gap-2">
              <Button
                variant={activeVideo === 'teacher' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveVideo('teacher')}
                className="flex items-center gap-1"
              >
                <GraduationCap className="h-4 w-4" />
                Lesson Overview Video
              </Button>
              <Button
                variant={activeVideo === 'student' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveVideo('student')}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                For Students
              </Button>
            </div>
          )}
        </div>
        
        {/* Video type indicator */}
        <div className="flex items-center gap-2 mt-2">
          {activeVideo === 'teacher' ? (
            <Badge variant="secondary" className="bg-[#BD85C8] text-white border-0">
              <GraduationCap className="h-3 w-3 mr-1" />
              Lesson Overview Video
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-[#85B2C8] text-white border-0">
              <Users className="h-3 w-3 mr-1" />
              For Students
            </Badge>
          )}
          
          {activeVideo === 'student' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Show on Projector
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          {currentVideoId && (
            <iframe
              key={currentVideoId} // Force reload when switching videos
              src={`https://player.vimeo.com/video/${currentVideoId}${currentVideoId.includes('?h=') ? '&' : '?'}color=829B79&title=0&byline=0&portrait=0`}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`${lessonTitle} - ${activeVideo === 'teacher' ? 'Teacher Preparation' : 'Student Video'}`}
            />
          )}
        </div>
        
        {/* Helper text */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {activeVideo === 'teacher' 
            ? "Watch this video to prepare for teaching this lesson. Review key concepts and teaching strategies."
            : "Show this video to your students on the projector to introduce the lesson concepts."
          }
        </p>
      </CardContent>
    </Card>
  );
}