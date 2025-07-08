import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InviteCoTeacherModal } from '../InviteCoTeacherModal';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/config/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
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

describe('InviteCoTeacherModal', () => {
  const mockClassId = 'test-class-id';
  const mockOnSuccess = vi.fn();
  const defaultProps = {
    classId: mockClassId,
    onSuccess: mockOnSuccess,
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal with form fields', () => {
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('Invite Co-Teacher')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Personal Message (optional)')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByText('Send Invitation');

    // Try invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Form should not submit with invalid email
    expect(screen.getByLabelText('Email Address')).toHaveValue('invalid-email');
  });

  test('sends invitation with correct data', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, collaborator: { id: 'new-collab-id' } },
    });

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    // Fill form
    await user.type(screen.getByLabelText('Email Address'), 'newteacher@example.com');
    await user.click(screen.getByLabelText('Role'));
    await user.click(screen.getByText('Editor'));
    await user.type(screen.getByLabelText('Personal Message (optional)'), 'Welcome to the class!');

    // Submit
    await user.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/classes/${mockClassId}/collaborators/invite`,
        {
          email: 'newteacher@example.com',
          role: 'editor',
          message: 'Welcome to the class!',
        }
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith({
      title: 'Invitation sent',
      description: 'The co-teacher has been invited to collaborate on this class.',
    });
  });

  test('handles user not found error', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 404,
        data: { error: 'User with this email not found. They must create an account first.' },
      },
    });

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Email Address'), 'notfound@example.com');
    await user.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'User not found',
        description: 'User with this email not found. They must create an account first.',
        variant: 'destructive',
      });
    });
  });

  test('handles duplicate invitation error', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'An invitation is already pending for this user' },
      },
    });

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Email Address'), 'existing@example.com');
    await user.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Invitation already sent',
        description: 'An invitation is already pending for this user',
        variant: 'destructive',
      });
    });
  });

  test('handles rate limiting', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 429,
        data: { message: 'Too many invitations sent. Please try again tomorrow.' },
      },
    });

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Rate limit exceeded',
        description: 'Too many invitations sent. Please try again tomorrow.',
        variant: 'destructive',
      });
    });
  });

  test('disables form during submission', async () => {
    const { api } = await import('@/config/api');
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(api.post).mockReturnValue(promise);

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByText('Send Invitation'));

    // Check that button is disabled and shows loading state
    const submitButton = screen.getByText('Sending...');
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ data: { success: true } });
  });

  test('shows permission information for viewer role', async () => {
    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText('Role'));
    await user.click(screen.getByText('Viewer'));

    expect(screen.getByText(/can view class data and analytics/)).toBeInTheDocument();
  });

  test('shows permission information for editor role', async () => {
    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText('Role'));
    await user.click(screen.getByText('Editor'));

    expect(screen.getByText(/can manage students and curriculum/)).toBeInTheDocument();
  });

  test('closes modal on cancel', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <InviteCoTeacherModal {...defaultProps} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('handles email sending failure with manual link', async () => {
    const { api } = await import('@/config/api');
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        warning: 'Invitation created but email could not be sent',
        invitationUrl: 'http://localhost:5173/invitations/accept/test-token',
      },
    });

    const user = userEvent.setup();
    render(<InviteCoTeacherModal {...defaultProps} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Invitation created',
        description: expect.stringContaining('email could not be sent'),
      });
    });
  });
});