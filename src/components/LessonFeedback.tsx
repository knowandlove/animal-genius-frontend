import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";

interface LessonFeedbackProps {
  lessonId: number;
  lessonTitle: string;
}

interface FeedbackData {
  id: string;
  lessonId: number;
  teacherId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export function LessonFeedback({ lessonId, lessonTitle }: LessonFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing feedback
  const { data: existingFeedback, isLoading } = useQuery<FeedbackData | null>({
    queryKey: [`/api/classes/lessons/${lessonId}/my-feedback`],
    queryFn: () => apiRequest("GET", `/api/classes/lessons/${lessonId}/my-feedback`),
  });

  // Set initial values if feedback exists
  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setComment(existingFeedback.comment || "");
    }
  }, [existingFeedback]);

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      setIsSubmitting(true);
      return apiRequest("POST", `/api/classes/lessons/${lessonId}/feedback`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classes/lessons/${lessonId}/my-feedback`] });
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "You must select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({ rating, comment: comment.trim() });
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-all duration-200 hover:scale-110 focus:outline-none focus:scale-110"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors duration-200",
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">
          How was the {lessonTitle} Lesson?
          {existingFeedback && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (You can update your feedback)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Rate this lesson
          </label>
          {renderStars()}
          {rating > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              You rated: {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Additional comments (optional)
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this lesson..."
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {comment.length}/1000 characters
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Submitting...
            </>
          ) : existingFeedback ? (
            "Update Feedback"
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}