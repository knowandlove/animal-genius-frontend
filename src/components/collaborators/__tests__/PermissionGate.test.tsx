import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from '../PermissionGate';
import { useClassRole } from '../useClassRole';

// Mock the useClassRole hook
vi.mock('../useClassRole', () => ({
  useClassRole: vi.fn(),
}));

describe('PermissionGate', () => {
  test('renders children when user has required role', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'owner',
      permissions: {},
      isLoading: false,
    });

    render(
      <PermissionGate allowedRoles={['owner', 'editor']}>
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('does not render children when user lacks required role', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'viewer',
      permissions: { can_view_analytics: true },
      isLoading: false,
    });

    render(
      <PermissionGate allowedRoles={['owner', 'editor']}>
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders fallback when provided and user lacks permission', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'viewer',
      permissions: { can_view_analytics: true },
      isLoading: false,
    });

    render(
      <PermissionGate 
        allowedRoles={['owner', 'editor']}
        fallback={<div>No Permission</div>}
      >
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('No Permission')).toBeInTheDocument();
  });

  test('renders children when user has required permission', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'editor',
      permissions: { 
        can_manage_students: true,
        can_view_analytics: true,
      },
      isLoading: false,
    });

    render(
      <PermissionGate requiredPermission="can_manage_students">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('does not render children when user lacks required permission', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'viewer',
      permissions: { 
        can_view_analytics: true,
        can_manage_students: false,
      },
      isLoading: false,
    });

    render(
      <PermissionGate requiredPermission="can_manage_students">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders nothing when loading', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: null,
      permissions: {},
      isLoading: true,
    });

    render(
      <PermissionGate allowedRoles={['owner']}>
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('owner bypasses permission checks', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'owner',
      permissions: {}, // No specific permissions
      isLoading: false,
    });

    render(
      <PermissionGate requiredPermission="can_manage_students">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('checks both role and permission when both are specified', () => {
    // User has the role but not the permission
    vi.mocked(useClassRole).mockReturnValue({
      role: 'editor',
      permissions: { 
        can_manage_students: false,
      },
      isLoading: false,
    });

    render(
      <PermissionGate 
        allowedRoles={['editor', 'owner']}
        requiredPermission="can_manage_students"
      >
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when no restrictions specified', () => {
    vi.mocked(useClassRole).mockReturnValue({
      role: 'viewer',
      permissions: {},
      isLoading: false,
    });

    render(
      <PermissionGate>
        <div>Unrestricted Content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Unrestricted Content')).toBeInTheDocument();
  });
});