import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Eye, ThumbsUp, Pin, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Discussion } from '@/types/community';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/config/community';
import { getAssetUrl } from '@/utils/cloud-assets';

// Helper function for animal image paths
function getAnimalImagePath(animal: string): string {
  const imageMap: Record<string, string> = {
    'Meerkat': '/images/meerkat.png',
    'Panda': '/images/panda.png',
    'Owl': '/images/owl.png',
    'Beaver': '/images/beaver.png',
    'Elephant': '/images/elephant.png',
    'Otter': '/images/otter.png',
    'Parrot': '/images/parrot.png',
    'Border Collie': '/images/collie.png'
  };
  
  const imagePath = imageMap[animal] || '/images/kal-character.png';
  return getAssetUrl(imagePath);
}

interface DiscussionCardProps {
  discussion: Discussion;
  isPinned?: boolean;
  onClick?: () => void;
}

export function DiscussionCard({ discussion, isPinned, onClick }: DiscussionCardProps) {
  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer",
        isPinned && "border-primary/50 bg-primary/5"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Discussion: ${discussion.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isPinned && (
                <Pin className="w-4 h-4 text-primary" />
              )}
              <Badge variant="secondary" className={CATEGORY_COLORS[discussion.category]}>
                {CATEGORY_LABELS[discussion.category]}
              </Badge>
              {discussion.status === 'resolved' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors" title={discussion.title}>
              {discussion.title}
            </h3>
            
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {discussion.tags.slice(0, 3).map(tag => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
                {discussion.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{discussion.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {discussion.body}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {discussion.replyCount || 0} replies
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {discussion.viewCount} views
            </span>
            {(discussion.helpfulCount || 0) > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {discussion.helpfulCount} helpful
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {discussion.teacher && (
              <>
                {discussion.teacher.personalityAnimal && (
                  <img
                    src={getAnimalImagePath(discussion.teacher.personalityAnimal)}
                    alt={`${discussion.teacher.personalityAnimal} avatar`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = getAssetUrl('/images/kal-character.png');
                    }}
                  />
                )}
                <span className="font-medium">
                  {discussion.teacher.firstName} {discussion.teacher.lastName?.charAt(0)}.
                </span>
                {discussion.teacher.personalityAnimal && (
                  <Badge variant="outline" className="text-xs">
                    {discussion.teacher.personalityAnimal}
                  </Badge>
                )}
              </>
            )}
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}