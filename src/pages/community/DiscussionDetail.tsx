import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeft, 
  Eye, 
  ThumbsUp, 
  Share2, 
  Edit, 
  Trash2,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useDiscussion, useArchiveDiscussion, useUpdateDiscussion } from '@/hooks/community/useDiscussions';
import { useCreateReply } from '@/hooks/community/useReplies';
import { useCreateInteraction, useDiscussionInteractions } from '@/hooks/community/useInteractions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReplyThread } from '@/components/community/ReplyThread';
import { cn } from '@/lib/utils';
import type { CreateReplyRequest, UpdateDiscussionRequest } from '@/types/community';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/config/community';

const editDiscussionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  body: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be less than 5000 characters'),
});

export default function DiscussionDetail() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const discussionId = params.id;
  
  const [replyText, setReplyText] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userInteractions, setUserInteractions] = useState<Set<string>>(new Set());
  
  const editForm = useForm<z.infer<typeof editDiscussionSchema>>({
    resolver: zodResolver(editDiscussionSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  });
  
  const { data: discussion, isLoading, error } = useDiscussion(discussionId);
  
  // Debug logging
  useEffect(() => {
    if (discussion) {
      console.log('[DiscussionDetail] Discussion data:', {
        id: discussion.id,
        title: discussion.title,
        hasReplies: !!discussion.replies,
        repliesLength: discussion.replies?.length || 0,
        repliesData: discussion.replies
      });
    }
  }, [discussion]);
  const { data: existingInteractions } = useDiscussionInteractions(discussionId);
  const createReplyMutation = useCreateReply(discussionId!);
  const createInteractionMutation = useCreateInteraction();
  const archiveMutation = useArchiveDiscussion();
  const updateMutation = useUpdateDiscussion(discussionId!);

  const isAuthor = user?.id === discussion?.teacherId;
  
  // Populate edit form when discussion loads
  useEffect(() => {
    if (discussion) {
      editForm.reset({
        title: discussion.title,
        body: discussion.body,
      });
    }
  }, [discussion, editForm]);
  
  // Set existing interactions
  useEffect(() => {
    if (existingInteractions) {
      const interactionTypes = new Set<string>();
      if (existingInteractions.helpful) interactionTypes.add('helpful');
      if (existingInteractions.tried_it) interactionTypes.add('tried_it');
      if (existingInteractions.shared) interactionTypes.add('shared');
      setUserInteractions(interactionTypes);
    }
  }, [existingInteractions]);

  const handleBack = () => {
    setLocation('/community');
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !discussionId) return;
    
    try {
      const request: CreateReplyRequest = {
        body: replyText.trim(),
      };
      
      await createReplyMutation.mutateAsync(request);
      setReplyText('');
      setIsReplyOpen(false);
      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the discussion",
      });
    } catch (error: any) {
      toast({
        title: "Failed to post reply",
        description: error.message || 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleInteraction = async (type: 'helpful' | 'tried_it' | 'shared') => {
    if (!discussionId) return;
    
    console.log('Handling interaction:', type, 'for discussion:', discussionId);
    
    // Handle share functionality
    if (type === 'shared') {
      const url = `${window.location.origin}/community/discussion/${discussionId}`;
      
      try {
        // Try to use the modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          // Show success feedback
          toast({
            title: "Link copied!",
            description: "Discussion link has been copied to your clipboard",
          });
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            toast({
              title: "Link copied!",
              description: "Discussion link has been copied to your clipboard",
            });
          } catch (err) {
            toast({
              title: "Copy failed",
              description: `Please copy manually: ${url}`,
              variant: "destructive",
            });
          } finally {
            document.body.removeChild(textArea);
          }
        }
        
        // Still record the share interaction
        const result = await createInteractionMutation.mutateAsync({
          type: 'shared',
          discussionId,
        });
        
        // Update local state based on action
        if (result.action === 'created') {
          setUserInteractions(prev => new Set([...prev, 'shared']));
        } else {
          setUserInteractions(prev => {
            const newSet = new Set(prev);
            newSet.delete('shared');
            return newSet;
          });
        }
      } catch (error: any) {
        toast({
          title: "Share failed",
          description: "Unable to share this discussion",
          variant: "destructive",
        });
      }
      return;
    }
    
    // Handle other interactions
    try {
      console.log('Sending interaction request for:', type);
      const result = await createInteractionMutation.mutateAsync({
        type,
        discussionId,
      });
      console.log('Interaction result:', result);
      
      // Update local state based on action
      if (result.action === 'created') {
        setUserInteractions(prev => new Set([...prev, type]));
      } else {
        setUserInteractions(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message || 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleArchive = async () => {
    if (!discussionId) return;
    
    try {
      await archiveMutation.mutateAsync(discussionId);
      toast({
        title: "Discussion deleted",
        description: "The discussion has been removed",
      });
      setLocation('/community');
    } catch (error: any) {
      toast({
        title: "Failed to delete discussion",
        description: error.message || 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleMarkResolved = async () => {
    if (!discussionId || !discussion) return;
    
    try {
      await updateMutation.mutateAsync({
        status: 'resolved',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleEditSubmit = async (data: z.infer<typeof editDiscussionSchema>) => {
    if (!discussionId) return;
    
    try {
      await updateMutation.mutateAsync(data);
      setIsEditOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Discussion not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Community
      </Button>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {discussion.isPinned && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Pinned
                    </Badge>
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
                
                <h1 className="text-2xl font-bold mb-2">{discussion.title}</h1>
                
                {discussion.tags && discussion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {discussion.tags.map(tag => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Author info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                {discussion.teacher && (
                  <>
                    <span className="font-medium">
                      {discussion.teacher.firstName} {discussion.teacher.lastName}
                    </span>
                    {discussion.teacher.personalityAnimal && (
                      <Badge variant="outline" className="text-xs">
                        {discussion.teacher.personalityAnimal}
                      </Badge>
                    )}
                    {discussion.teacher.schoolOrganization && (
                      <span className="text-xs">
                        • {discussion.teacher.schoolOrganization}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {discussion.viewCount} views
                </span>
                <span>
                  {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{discussion.body}</p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={userInteractions.has('helpful') ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInteraction('helpful')}
                  className="gap-2"
                  disabled={createInteractionMutation.isPending}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({discussion.helpfulCount || 0})
                </Button>
                <Button
                  variant={userInteractions.has('tried_it') ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInteraction('tried_it')}
                  className="gap-2"
                  disabled={createInteractionMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  Tried It ({discussion.triedCount || 0})
                </Button>
                <Button
                  variant={userInteractions.has('shared') ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInteraction('shared')}
                  className="gap-2"
                  disabled={createInteractionMutation.isPending}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              
              {isAuthor && (
                <div className="flex flex-wrap items-center gap-2">
                  {discussion.status !== 'resolved' && discussion.category === 'ask_teachers' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkResolved}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Resolved
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Replies ({discussion?.replies?.length || discussion?.replyCount || 0})
          </h2>
          <Button onClick={() => setIsReplyOpen(true)}>
            Add Reply
          </Button>
        </div>

        {isReplyOpen && (
          <Card>
            <CardContent className="pt-6">
              <Textarea
                placeholder="Share your thoughts or advice..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReplyOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || createReplyMutation.isPending}
                >
                  Post Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {console.log('[DiscussionDetail] Rendering replies section:', {
          hasReplies: !!discussion.replies,
          repliesLength: discussion.replies?.length,
          repliesCheck: discussion.replies && discussion.replies.length > 0
        })}
        {discussion.replies && discussion.replies.length > 0 ? (
          <ReplyThread 
            replies={discussion.replies} 
            discussionId={discussion.id}
            discussionAuthorId={discussion.teacherId}
            parentReplyId={null}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No replies yet. Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discussion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this discussion? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>
              Make changes to your discussion below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                {...editForm.register('title')}
                placeholder="What's your discussion about?"
              />
              {editForm.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {editForm.formState.errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-body">Description</Label>
              <Textarea
                id="edit-body"
                {...editForm.register('body')}
                placeholder="Provide details about your discussion topic..."
                rows={8}
              />
              {editForm.formState.errors.body && (
                <p className="text-sm text-destructive mt-1">
                  {editForm.formState.errors.body.message}
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}