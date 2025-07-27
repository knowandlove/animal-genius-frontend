// Community Hub Types

export interface Discussion {
  id: string;
  teacherId: string;
  title: string;
  body: string;
  category: 'lessons' | 'animals' | 'challenges' | 'success_stories' | 'ask_teachers' | 'feedback';
  viewCount: number;
  isPinned: boolean;
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  updatedAt: string;
  
  // Relations that come from API
  teacher?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    personalityAnimal: string | null;
    schoolOrganization?: string | null;
  };
  tags?: Tag[];
  replyCount?: number;
  helpfulCount?: number;
  triedCount?: number;
  replies?: Reply[];
}

export interface Tag {
  id: string;
  name: string;
  category: 'grade' | 'animal_mix' | 'challenge_type' | 'class_dynamic' | 'time_of_year';
  slug: string;
  usageCount: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  discussionId: string;
  parentReplyId: string | null;
  teacherId: string;
  body: string;
  helpfulCount: number;
  isAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  teacher?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    personalityAnimal: string | null;
  };
  childReplies?: Reply[];
}

export interface Interaction {
  id: string;
  teacherId: string;
  discussionId: string | null;
  replyId: string | null;
  type: 'viewed' | 'helpful' | 'saved' | 'tried_it' | 'shared';
  metadata: {
    workedForMe?: boolean;
    modifications?: string;
  };
  createdAt: string;
}

// Request/Response types
export interface CreateDiscussionRequest {
  title: string;
  body: string;
  category: Discussion['category'];
  tagIds: string[];
}

export interface UpdateDiscussionRequest {
  title?: string;
  body?: string;
  status?: Discussion['status'];
  tagIds?: string[];
}

export interface ListDiscussionsParams {
  category?: Discussion['category'];
  tags?: string[];
  grade?: string;
  sort?: 'recent' | 'trending' | 'helpful' | 'unanswered';
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListDiscussionsResponse {
  discussions: Discussion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReplyRequest {
  body: string;
  parentReplyId?: string;
}

export interface CreateInteractionRequest {
  type: Interaction['type'];
  discussionId?: string;
  replyId?: string;
  metadata?: {
    workedForMe?: boolean;
    modifications?: string;
  };
}

// UI State types
export interface TagsByCategory {
  [category: string]: Tag[];
}

export interface GroupedInteractions {
  [type: string]: (Interaction & {
    discussion?: Discussion;
    reply?: Reply;
  })[];
}