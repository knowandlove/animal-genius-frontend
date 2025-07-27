import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateDiscussion } from '@/hooks/community/useDiscussions';
import { useTagSuggestions, useSearchTags } from '@/hooks/community/useTags';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Discussion, CreateDiscussionRequest, Tag } from '@/types/community';
import { CATEGORIES } from '@/config/community';

const createDiscussionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  body: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be less than 5000 characters'),
  category: z.enum(['lessons', 'animals', 'challenges', 'success_stories', 'ask_teachers', 'feedback'], {
    errorMap: () => ({ message: 'Please select a category' })
  }),
});

interface CreateDiscussionProps {
  onSuccess?: (discussion: Discussion) => void;
}

export function CreateDiscussion({ onSuccess }: CreateDiscussionProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const createMutation = useCreateDiscussion();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof createDiscussionSchema>>({
    resolver: zodResolver(createDiscussionSchema),
  });

  const title = watch('title');
  const body = watch('body');
  
  // Debounce values to prevent excessive API calls
  const debouncedTitle = useDebounce(title, 500);
  const debouncedBody = useDebounce(body, 500);
  const debouncedTagInput = useDebounce(tagInput, 300);
  
  // Get tag suggestions based on title and body
  const { data: suggestedTags } = useTagSuggestions(debouncedTitle, debouncedBody);
  
  // Search tags as user types
  const { data: searchResults } = useSearchTags(debouncedTagInput);

  const onSubmit = async (data: z.infer<typeof createDiscussionSchema>) => {
    try {
      const request: CreateDiscussionRequest = {
        ...data,
        tagIds: selectedTags,
      };
      
      const discussion = await createMutation.mutateAsync(request);
      onSuccess?.(discussion);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Start a New Discussion</DialogTitle>
        <DialogDescription>
          Share your experiences, ask questions, or seek advice from the community
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="What's your discussion about?"
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            {...register('category')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Description</Label>
          <Textarea
            id="body"
            placeholder="Provide details about your discussion topic..."
            rows={6}
            {...register('body')}
          />
          {errors.body && (
            <p className="text-sm text-destructive">{errors.body.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <p className="text-sm text-muted-foreground">
            Add tags to help others find your discussion
          </p>
          
          {/* Tag suggestions */}
          {suggestedTags && suggestedTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Tag search */}
          <Input
            placeholder="Search for tags..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          
          {searchResults && searchResults.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchResults.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Memoize tag lookup for performance
                  const allTagsMap = new Map<string, Tag>();
                  [...(suggestedTags || []), ...(searchResults || [])].forEach(tag => {
                    allTagsMap.set(tag.id, tag);
                  });
                  
                  return selectedTags.map(tagId => {
                    const tag = allTagsMap.get(tagId);
                    return tag ? (
                      <Badge
                        key={tag.id}
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name} ×
                      </Badge>
                    ) : null;
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {createMutation.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {createMutation.error instanceof Error 
                ? createMutation.error.message 
                : 'Failed to create discussion'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Create Discussion
          </Button>
        </div>
      </form>
    </>
  );
}