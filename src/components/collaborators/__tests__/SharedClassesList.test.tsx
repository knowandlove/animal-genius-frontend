import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SharedClassesList } from '../SharedClassesList';

// Mock dependencies
vi.mock('@/config/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/teacher-dashboard', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SharedClassesList', () => {
  const mockClasses = [
    {
      id: 'owned-class-1',
      name: 'My Math Class',
      role: 'owner',
      classCode: 'MATH123',
      subject: 'Mathematics',
      gradeLevel: '5',
      isArchived: false,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'shared-class-1',
      name: 'Science Collaboration',
      role: 'editor',
      classCode: 'SCI456',
      subject: 'Science',
      gradeLevel: '6',
      isArchived: false,
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'shared-class-2',
      name: 'History View Only',
      role: 'viewer',
      classCode: 'HIST789',
      subject: 'History',
      gradeLevel: '7',
      isArchived: false,
      createdAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all accessible classes', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('My Math Class')).toBeInTheDocument();
      expect(screen.getByText('Science Collaboration')).toBeInTheDocument();
      expect(screen.getByText('History View Only')).toBeInTheDocument();
    });
  });

  test('displays role badges correctly', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });
  });

  test('shows class codes', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MATH123')).toBeInTheDocument();
      expect(screen.getByText('SCI456')).toBeInTheDocument();
      expect(screen.getByText('HIST789')).toBeInTheDocument();
    });
  });

  test('displays subject and grade level', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mathematics • Grade 5')).toBeInTheDocument();
      expect(screen.getByText('Science • Grade 6')).toBeInTheDocument();
      expect(screen.getByText('History • Grade 7')).toBeInTheDocument();
    });
  });

  test('shows empty state when no classes', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: [] },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No classes found/)).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SharedClassesList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load classes/)).toBeInTheDocument();
    });
  });

  test('filters out archived classes', async () => {
    const classesWithArchived = [
      ...mockClasses,
      {
        id: 'archived-class',
        name: 'Old Archived Class',
        role: 'owner',
        classCode: 'OLD123',
        subject: 'Math',
        gradeLevel: '4',
        isArchived: true,
        createdAt: '2023-01-01T00:00:00Z',
      },
    ];

    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: classesWithArchived },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('My Math Class')).toBeInTheDocument();
      expect(screen.queryByText('Old Archived Class')).not.toBeInTheDocument();
    });
  });

  test('links to correct class pages', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const mathClassLink = screen.getByText('My Math Class').closest('a');
      expect(mathClassLink).toHaveAttribute('href', '/class/owned-class-1');

      const scienceClassLink = screen.getByText('Science Collaboration').closest('a');
      expect(scienceClassLink).toHaveAttribute('href', '/class/shared-class-1');
    });
  });

  test('sorts classes by creation date (newest first)', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const classNames = screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent);
      // Classes should be sorted by createdAt descending
      expect(classNames).toEqual([
        'History View Only',
        'Science Collaboration', 
        'My Math Class'
      ]);
    });
  });

  test('shows appropriate icons for different roles', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: { classes: mockClasses },
    });

    render(<SharedClassesList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for role-specific styling or icons
      const ownerBadge = screen.getByText('Owner');
      expect(ownerBadge.className).toContain('bg-blue');

      const editorBadge = screen.getByText('Editor');
      expect(editorBadge.className).toContain('bg-green');

      const viewerBadge = screen.getByText('Viewer');
      expect(viewerBadge.className).toContain('bg-gray');
    });
  });
});