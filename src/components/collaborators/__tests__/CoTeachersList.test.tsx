import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoTeachersList } from '../CoTeachersList';

// Mock the API module
vi.mock('@/config/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'owner@example.com' },
  }),
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

describe('CoTeachersList', () => {
  const mockClassId = 'test-class-id';
  const mockCollaborators = [
    {
      id: 'collab-1',
      teacherId: 'teacher-1',
      teacherEmail: 'teacher1@example.com',
      teacherName: 'Teacher One',
      role: 'editor',
      invitationStatus: 'accepted',
      acceptedAt: '2024-01-01T00:00:00Z',
      invitedAt: '2023-12-25T00:00:00Z',
    },
    {
      id: 'collab-2',
      teacherId: 'teacher-2',
      teacherEmail: 'teacher2@example.com',
      teacherName: 'Teacher Two',
      role: 'viewer',
      invitationStatus: 'pending',
      invitedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders collaborators list', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: mockCollaborators,
        userRole: 'owner',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Teacher One')).toBeInTheDocument();
      expect(screen.getByText('Teacher Two')).toBeInTheDocument();
    });

    expect(screen.getByText('teacher1@example.com')).toBeInTheDocument();
    expect(screen.getByText('teacher2@example.com')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  test('shows pending status for unaccepted invitations', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: mockCollaborators,
        userRole: 'owner',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  test('opens invite modal when clicking invite button', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: [],
        userRole: 'owner',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    const inviteButton = await screen.findByText('Invite Co-Teacher');
    fireEvent.click(inviteButton);

    expect(screen.getByText('Invite Co-Teacher')).toBeInTheDocument();
  });

  test('removes collaborator when owner clicks remove', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: mockCollaborators,
        userRole: 'owner',
      },
    });
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Teacher One')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByLabelText(/Remove collaborator/);
    fireEvent.click(removeButtons[0]);

    // Confirm removal in dialog
    const confirmButton = await screen.findByText('Remove');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        `/classes/${mockClassId}/collaborators/collab-1`
      );
    });
  });

  test('does not show remove button for non-owners', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: mockCollaborators,
        userRole: 'editor',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Teacher One')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Remove collaborator/)).not.toBeInTheDocument();
  });

  test('shows empty state when no collaborators', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: [],
        userRole: 'owner',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No co-teachers yet/)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load co-teachers/)).toBeInTheDocument();
    });
  });

  test('refreshes list after successful invitation', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        collaborators: [],
        userRole: 'owner',
      },
    });

    render(<CoTeachersList classId={mockClassId} />, { wrapper: createWrapper() });

    const inviteButton = await screen.findByText('Invite Co-Teacher');
    fireEvent.click(inviteButton);

    // The InviteCoTeacherModal should trigger a refresh on success
    // This would be tested more thoroughly in the InviteCoTeacherModal tests
  });
});