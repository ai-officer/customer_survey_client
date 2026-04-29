import { describe, it, expect, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { renderWithProviders } from '../../tests/test-utils';
import Layout from './Layout';

// Surfaces the current router location so tests can assert post-navigate state.
function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location" data-pathname={location.pathname} />;
}

function renderLayout(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(
    <Layout>
      <LocationSpy />
      <div>page content</div>
    </Layout>,
    opts,
  );
}

describe('Layout', () => {
  it('shows workspace nav but hides administration items for managers', () => {
    const { container } = renderLayout({ auth: 'manager' });

    const sidebar = container.querySelector('aside') as HTMLElement;
    expect(sidebar).toBeInTheDocument();

    expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'Surveys' })).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Departments' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Audit Logs' })).toBeNull();
    expect(screen.queryByText('administration')).toBeNull();
  });

  it('shows all six nav items including the administration section for admins', () => {
    const { container } = renderLayout({ auth: 'admin' });

    const sidebar = container.querySelector('aside') as HTMLElement;
    expect(within(sidebar).getByText('workspace')).toBeInTheDocument();
    expect(within(sidebar).getByText('administration')).toBeInTheDocument();

    expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'Surveys' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'Departments' })).toBeInTheDocument();
    // Audit Logs is the only nav item not duplicated in the mobile bottom nav (which slices to 4),
    // so a global query stays unambiguous.
    expect(screen.getByRole('link', { name: 'Audit Logs' })).toBeInTheDocument();
  });

  it('highlights the Surveys link with the active accent rail when on /surveys', () => {
    renderLayout({ auth: 'admin', route: '/surveys' });

    // Index 0 is the desktop sidebar link; index 1 is the mobile bottom-nav duplicate.
    const surveysLink = screen.getAllByRole('link', { name: 'Surveys' })[0];
    expect(surveysLink.className).toMatch(/font-medium/);

    // Active state injects a span[aria-hidden] for the accent rail; only present when active.
    const accentRail = surveysLink.querySelector('span[aria-hidden]');
    expect(accentRail).not.toBeNull();

    const dashboardLink = screen.getAllByRole('link', { name: 'Dashboard' })[0];
    expect(dashboardLink.className).not.toMatch(/font-medium/);
    expect(dashboardLink.querySelector('span[aria-hidden]')).toBeNull();
  });

  it('reflects the active route in the top-bar page title', () => {
    const { unmount } = renderLayout({ auth: 'admin', route: '/' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
    unmount();

    const surveysRender = renderLayout({ auth: 'admin', route: '/surveys' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Surveys');
    surveysRender.unmount();

    renderLayout({ auth: 'admin', route: '/settings/users' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Users');
  });

  it('shows user full name and role; clicking the user pill opens a popover with Change password + Sign out', async () => {
    const user = userEvent.setup();
    renderLayout({ auth: 'admin' });

    const topBar = screen.getByRole('heading', { level: 1 }).closest('header') as HTMLElement;
    expect(topBar).not.toBeNull();
    expect(within(topBar).getByText('Admin User')).toBeInTheDocument();
    expect(within(topBar).getByText('admin')).toBeInTheDocument();

    // Before opening the popover, only the desktop sidebar's "Sign out" exists.
    expect(screen.getAllByRole('button', { name: /sign out/i })).toHaveLength(1);

    const pillButton = within(topBar).getByRole('button');
    await user.click(pillButton);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /sign out/i })).toHaveLength(2);
    });
    expect(screen.getAllByRole('button', { name: /change password/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('signs out via the user popover by calling logout() and navigating to /login', async () => {
    const user = userEvent.setup();
    const logoutMock = vi.fn();
    renderLayout({ auth: { user: { id: 'u1', email: 'a@x.com', full_name: 'Admin User', role: 'admin' }, token: 't', logout: logoutMock }, route: '/' });

    const topBar = screen.getByRole('heading', { level: 1 }).closest('header') as HTMLElement;
    await user.click(within(topBar).getByRole('button'));

    // Sidebar + popover both render "Sign out"; the popover button is last in document order.
    const signOutButtons = await screen.findAllByRole('button', { name: /sign out/i });
    expect(signOutButtons.length).toBeGreaterThanOrEqual(2);
    await user.click(signOutButtons[signOutButtons.length - 1]);

    expect(logoutMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveAttribute('data-pathname', '/login');
    });
  });

  it('toggles the mobile drawer when the mobile menu button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderLayout({ auth: 'admin' });

    expect(container.querySelectorAll('aside').length).toBe(1);

    // The mobile <header> renders first in the DOM; its only button is the drawer toggle.
    const mobileHeader = container.querySelectorAll('header')[0] as HTMLElement;
    const menuButton = mobileHeader.querySelector('button') as HTMLButtonElement;
    expect(menuButton).not.toBeNull();

    await user.click(menuButton);

    await waitFor(() => {
      expect(container.querySelectorAll('aside').length).toBe(2);
    });

    await user.click(menuButton);

    // AnimatePresence delays unmount until the exit animation finishes.
    await waitFor(() => {
      expect(container.querySelectorAll('aside').length).toBe(1);
    });
  });
});
