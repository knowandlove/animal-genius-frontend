import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MessageSquare, CheckCircle, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateReply, useUpdateReply, useDeleteReply, useAcceptAnswer } from '@/hooks/community/useReplies';
import { useCreateInteraction } from '@/hooks/community/useInteractions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Reply, CreateReplyRequest } from '@/types/community';

interface ReplyThreadProps {
  replies: Reply[];
  discussionId: string;
  discussionAuthorId: string;
  parentReplyId?: string;
  level?: number;
}

export function ReplyThread({ 
  replies, 
  discussionId, 
  discussionAuthorId,
  parentReplyId,
  level = 0 
}: ReplyThreadProps) {
  console.log('[ReplyThread] Rendering with:', {
    repliesCount: replies.length,
    discussionId,
    parentReplyId,
    level,
    replies: replies.map(r => ({ id: r.id, parentReplyId: r.parentReplyId }))
  });
  const { user } = useAuth();
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState('');
  
  const createReplyMutation = useCreateReply(discussionId);
  const updateReplyMutation = useUpdateReply(discussionId);
  const deleteReplyMutation = useDeleteReply(discussionId);
  const acceptAnswerMutation = useAcceptAnswer(discussionId);
  const createInteractionMutation = useCreateInteraction();

  // Memoize reply processing for performance
  const { levelReplies, repliesByParent } = useMemo(() => {
    const repliesByParent = new Map<string | null | undefined, Reply[]>();
    
    for (const reply of replies) {
      const parentId = reply.parentReplyId;
      if (!repliesByParent.has(parentId)) {
        repliesByParent.set(parentId, []);
      }
      repliesByParent.get(parentId)!.push(reply);
    }
    
    const levelReplies = repliesByParent.get(parentReplyId) || [];
    console.log('[ReplyThread] Reply processing:', {
      parentReplyId,
      mapKeys: Array.from(repliesByParent.keys()).map(k => k === null ? 'null' : k === undefined ? 'undefined' : k),
      levelRepliesCount: levelReplies.length,
      levelReplies: levelReplies.map(r => ({ id: r.id, parentReplyId: r.parentReplyId })),
      allRepliesParentIds: replies.map(r => ({ id: r.id, parentReplyId: r.parentReplyId }))
    });
    
    return {
      levelReplies,
      repliesByParent,
    };
  }, [replies, parentReplyId]);

  const toggleExpanded = (replyId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(replyId)) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    
    try {
      const request: CreateReplyRequest = {
        body: replyText.trim(),
        parentReplyId: parentId,
      };
      
      await createReplyMutation.mutateAsync(request);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditSubmit = async (replyId: string) => {
    if (!editText.trim()) return;
    
    try {
      await updateReplyMutation.mutateAsync({ replyId, body: editText.trim() });
      setEditText('');
      setEditingReply(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      await deleteReplyMutation.mutateAsync(replyId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    try {
      await acceptAnswerMutation.mutateAsync(replyId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleHelpful = async (replyId: string) => {
    try {
      await createInteractionMutation.mutateAsync({
        type: 'helpful',
        replyId,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (levelReplies.length === 0) return null;

  return (
    <div className={cn("space-y-4", level > 0 && "ml-8 mt-4")}>
      {levelReplies.map(reply => {
        const isExpanded = expandedReplies.has(reply.id);
        const childReplies = repliesByParent.get(reply.id) || [];
        const hasChildren = childReplies.length > 0;
        const isAuthor = user?.id === reply.teacherId;
        const isDiscussionAuthor = user?.id === discussionAuthorId;
        
        return (
          <Card key={reply.id} className={cn(
            reply.isAcceptedAnswer && "border-green-500 bg-green-50/50"
          )}>
            <CardContent className="pt-4">
              {/* Reply header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm">
                  {reply.teacher && (
                    <>
                      <span className="font-medium">
                        {reply.teacher.firstName} {reply.teacher.lastName}
                      </span>
                      {reply.teacher.personalityAnimal && (
                        <Badge variant="outline" className="text-xs">
                          {reply.teacher.personalityAnimal}
                        </Badge>
                      )}
                    </>
                  )}
                  {reply.isAcceptedAnswer && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Accepted Answer
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Reply body */}
              {editingReply === reply.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingReply(null);
                        setEditText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleEditSubmit(reply.id)}
                      disabled={!editText.trim() || updateReplyMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
              )}

              {/* Reply actions */}
              {editingReply !== reply.id && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(reply.id)}
                      className="h-8 gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {reply.helpfulCount > 0 && reply.helpfulCount}
                    </Button>
                    
                    {level < 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(reply.id)}
                        className="h-8 gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Reply
                      </Button>
                    )}
                    
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(reply.id)}
                        className="h-8 gap-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        {childReplies.length} replies
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!reply.isAcceptedAnswer && isDiscussionAuthor && level === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcceptAnswer(reply.id)}
                        className="h-8 gap-1 text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Accept Answer
                      </Button>
                    )}
                    
                    {isAuthor && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingReply(reply.id);
                            setEditText(reply.body);
                          }}
                          className="h-8"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reply.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Reply form */}
              {replyingTo === reply.id && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleReplySubmit(reply.id)}
                      disabled={!replyText.trim() || createReplyMutation.isPending}
                    >
                      Post Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Nested replies */}
              {isExpanded && hasChildren && (
                <ReplyThread
                  replies={replies}
                  discussionId={discussionId}
                  discussionAuthorId={discussionAuthorId}
                  parentReplyId={reply.id}
                  level={level + 1}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}