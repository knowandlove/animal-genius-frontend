import { Badge } from "@/components/ui/badge";

interface IslandHeaderProps {
  studentName: string;
  animalType: string;
  className: string;
}

export default function IslandHeader({ studentName, animalType, className }: IslandHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {studentName}'s Island
            </h1>
            <Badge variant="secondary" className="text-xs sm:text-sm hidden sm:inline-flex">
              {animalType} • {className}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
