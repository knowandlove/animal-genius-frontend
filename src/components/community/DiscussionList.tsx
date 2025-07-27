import { useLocation } from 'wouter';
import { useDiscussions } from '@/hooks/community/useDiscussions';
import { DiscussionCard } from './DiscussionCard';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { ListDiscussionsParams } from '@/types/community';

interface DiscussionListProps {
  filters: ListDiscussionsParams;
  onPageChange: (page: number) => void;
}

export function DiscussionList({ filters, onPageChange }: DiscussionListProps) {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = useDiscussions(filters);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load discussions</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Please try again later'}
        </p>
      </div>
    );
  }

  if (!data || data.discussions.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No discussions yet"
        description={
          filters.search
            ? `No discussions found matching "${filters.search}"`
            : filters.category
            ? "Be the first to start a discussion in this category"
            : "Be the first to start a discussion in the community"
        }
      />
    );
  }

  const { discussions, pagination } = data;

  return (
    <div className="space-y-4">
      {/* Pinned discussions */}
      {discussions.filter(d => d.isPinned).map(discussion => (
        <DiscussionCard
          key={discussion.id}
          discussion={discussion}
          isPinned
          onClick={() => setLocation(`/community/discussion/${discussion.id}`)}
        />
      ))}

      {/* Regular discussions */}
      {discussions.filter(d => !d.isPinned).map(discussion => (
        <DiscussionCard
          key={discussion.id}
          discussion={discussion}
          onClick={() => setLocation(`/community/discussion/${discussion.id}`)}
        />
      ))}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              if (pageNum < 1 || pageNum > pagination.totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4">
        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} discussions
      </div>
    </div>
  );
}