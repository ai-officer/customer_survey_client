import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../tests/test-utils';
import { AppRoutes } from './App';

describe('App route guards', () => {
  it('redirects unauthenticated users from / to /login', async () => {
    renderWithProviders(<AppRoutes />, { route: '/', auth: 'signed-out' });

    // Login page renders the "Welcome back." heading; that heading is unique
    // to the Login screen.
    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('renders the Dashboard at / for authenticated managers', async () => {
    renderWithProviders(<AppRoutes />, { route: '/', auth: 'manager' });

    expect(
      await screen.findByRole('heading', { name: /customer satisfaction/i }),
    ).toBeInTheDocument();
  });

  it('redirects managers away from /settings/users back to /', async () => {
    renderWithProviders(<AppRoutes />, { route: '/settings/users', auth: 'manager' });

    // After redirect, Dashboard renders. UserManagement's distinctive
    // eyebrow text must NOT be present.
    expect(
      await screen.findByRole('heading', { name: /customer satisfaction/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/administration · directory/i)).not.toBeInTheDocument();
  });

  it('renders UserManagement at /settings/users for admins', async () => {
    renderWithProviders(<AppRoutes />, { route: '/settings/users', auth: 'admin' });

    // UserManagement's eyebrow text is unique to that page (the "Users"
    // heading also appears in the Layout title bar on this route).
    expect(
      await screen.findByText(/administration · directory/i),
    ).toBeInTheDocument();
  });

  it('redirects authenticated users away from /login back to /', async () => {
    renderWithProviders(<AppRoutes />, { route: '/login', auth: 'manager' });

    // Login's useEffect calls navigate('/') when a user is present, so we
    // wait for the Dashboard heading to appear.
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /customer satisfaction/i }),
      ).toBeInTheDocument();
    });
  });
});
