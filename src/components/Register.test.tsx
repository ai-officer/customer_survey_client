import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the api module so the test does not depend on `localStorage`, which is
// stubbed by Node 25 with a non-functional global that shadows jsdom's Storage.
// MSW would normally be preferred, but `api.post` walks through that broken
// `localStorage.getItem` before any fetch is issued.
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    postForm: vi.fn(),
  },
}));

import Register from './Register';
import { renderWithProviders } from '../../tests/test-utils';
import { api } from '@/lib/api';

const mockedPost = vi.mocked(api.post);

describe('Register page', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('renders the required fields and a submit button', () => {
    renderWithProviders(<Register />, { route: '/register' });

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit registration/i })).toBeInTheDocument();
  });

  it('shows a client-side error and does not submit when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { route: '/register' });

    await user.type(screen.getByLabelText(/full name/i), 'Juan dela Cruz');
    await user.type(screen.getByLabelText(/email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password999');
    await user.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    // Form is still visible (no success state), and api.post was never called.
    expect(screen.getByRole('button', { name: /submit registration/i })).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('shows the success state with a "Back to sign-in" link on a successful POST', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({ id: 'user-new-1', email: 'juan@example.com' });

    renderWithProviders(<Register />, { route: '/register' });

    await user.type(screen.getByLabelText(/full name/i), 'Juan dela Cruz');
    await user.type(screen.getByLabelText(/email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/request received/i)).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: /back to sign-in/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/login');

    expect(mockedPost).toHaveBeenCalledWith('/auth/register', {
      full_name: 'Juan dela Cruz',
      email: 'juan@example.com',
      password: 'password123',
    });
  });

  it('displays a server-side error message in the error banner', async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce(new Error('Email already registered'));

    renderWithProviders(<Register />, { route: '/register' });

    await user.type(screen.getByLabelText(/full name/i), 'Juan dela Cruz');
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    // Success state should not render.
    await waitFor(() =>
      expect(screen.queryByText(/request received/i)).not.toBeInTheDocument(),
    );
  });
});
