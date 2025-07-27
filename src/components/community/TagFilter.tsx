import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTags } from '@/hooks/community/useTags';
import type { ListDiscussionsParams } from '@/types/community';
import { GRADE_OPTIONS, SORT_OPTIONS } from '@/config/community';

interface TagFilterProps {
  onFiltersChange: (filters: Partial<ListDiscussionsParams>) => void;
  currentFilters: ListDiscussionsParams;
}

export function TagFilter({ onFiltersChange, currentFilters }: TagFilterProps) {
  const [searchValue, setSearchValue] = useState(currentFilters.search || '');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  
  const { data: tagsByCategory } = useTags();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: searchValue });
  };

  const handleTagToggle = (tagSlug: string) => {
    const currentTags = currentFilters.tags || [];
    const newTags = currentTags.includes(tagSlug)
      ? currentTags.filter(t => t !== tagSlug)
      : [...currentTags, tagSlug];
    
    onFiltersChange({ tags: newTags });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({
      search: undefined,
      tags: [],
      grade: undefined,
      sort: 'recent',
    });
  };

  const activeFilterCount = 
    (currentFilters.tags?.length || 0) + 
    (currentFilters.grade ? 1 : 0) + 
    (currentFilters.search ? 1 : 0) +
    (currentFilters.sort !== 'recent' ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* Sort */}
        <Select
          value={currentFilters.sort || 'recent'}
          onValueChange={(value) => onFiltersChange({ sort: value as ListDiscussionsParams['sort'] })}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade Filter */}
        <Select
          value={currentFilters.grade || 'all'}
          onValueChange={(value) => onFiltersChange({ grade: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {GRADE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tag Filter */}
        <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Tags
              {currentFilters.tags && currentFilters.tags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {currentFilters.tags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-[400px] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-medium">Filter by Tags</h4>
              
              {tagsByCategory && Object.entries(tagsByCategory).map(([category, tags]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground capitalize">
                    {category.replace('_', ' ')}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={currentFilters.tags?.includes(tag.slug) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag.slug)}
                      >
                        {tag.name}
                        {tag.usageCount > 0 && (
                          <span className="ml-1 text-xs opacity-60">
                            ({tag.usageCount})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(currentFilters.search || currentFilters.tags?.length || currentFilters.grade) && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {currentFilters.search}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ search: undefined });
                }}
              />
            </Badge>
          )}
          
          {currentFilters.grade && (
            <Badge variant="secondary" className="gap-1">
              Grade: {GRADE_OPTIONS.find(g => g.value === currentFilters.grade)?.label}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ grade: undefined })}
              />
            </Badge>
          )}
          
          {currentFilters.tags?.map(tagSlug => {
            const allTags = tagsByCategory ? Object.values(tagsByCategory).flat() : [];
            const tag = allTags.find(t => t.slug === tagSlug);
            return tag ? (
              <Badge key={tag.slug} variant="secondary" className="gap-1">
                {tag.name}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleTagToggle(tag.slug)}
                />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}