import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { DiscussionList } from '@/components/community/DiscussionList';
import { CreateDiscussion } from '@/components/community/CreateDiscussion';
import { TagFilter } from '@/components/community/TagFilter';
import type { Discussion, ListDiscussionsParams } from '@/types/community';
import { CATEGORIES } from '@/config/community';

export default function CommunityHub() {
  const [filters, setFilters] = useState<ListDiscussionsParams>({
    sort: 'recent',
    page: 1,
    limit: 10,
  });
  const [selectedCategory, setSelectedCategory] = useState<Discussion['category'] | 'all'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as Discussion['category'] | 'all');
    setFilters(prev => ({
      ...prev,
      category: value === 'all' ? undefined : value as Discussion['category'],
      page: 1, // Reset to first page when changing category
    }));
  };

  const handleFiltersChange = (newFilters: Partial<ListDiscussionsParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDiscussionCreated = () => {
    setIsCreateOpen(false);
    // Optionally reset to show all discussions to see the new one
    handleCategoryChange('all');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Community Hub"
        description="Connect with teachers, share strategies, and learn from each other's experiences"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 w-full">
          <TagFilter
            onFiltersChange={handleFiltersChange}
            currentFilters={filters}
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <CreateDiscussion onSuccess={handleDiscussionCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 w-full mb-6">
          <TabsTrigger value="all">All Discussions</TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <DiscussionList
            filters={filters}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        {CATEGORIES.map(cat => (
          <TabsContent key={cat.value} value={cat.value} className="mt-6">
            <p className="text-muted-foreground mb-4">
              {cat.description}
            </p>
            <DiscussionList
              filters={filters}
              onPageChange={handlePageChange}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}