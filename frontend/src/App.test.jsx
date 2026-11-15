import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { tokenStore } from './lib/api.js';
import { childUser, mockFetch, parentUser, specialistUser } from './testUtils.jsx';

const childRecord = { id: 1, name: 'Deniz Yıldız', grade: '4. sınıf', parentId: 1 };

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

const baseRoutes = (user) => ({
  'GET /auth/me': { user },
  'GET /children': { children: [childRecord] },
  'GET /children/1': { child: childRecord, role: user.role },
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('routing and roles (M1)', () => {
  it('sends a visitor without a session to the login page', async () => {
    renderApp('/children');
    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
  });

  it('logs a child in and shows only the child screen', async () => {
    mockFetch({
      ...baseRoutes(childUser),
      'POST /auth/login': { token: 'tok', user: childUser },
    });
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('E-posta'), 'deniz.yildiz@example.com');
    await userEvent.type(screen.getByLabelText('Şifre'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));

    expect(await screen.findByRole('heading', { name: 'Merhaba Deniz!' })).toBeInTheDocument();
    expect(tokenStore.get()).toBe('tok');
    expect(screen.getByTestId('current-user')).toHaveTextContent('Deniz Yıldız');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('shows the API error for wrong credentials', async () => {
    mockFetch({ 'POST /auth/login': { status: 401, body: { error: 'E-posta veya şifre hatalı.' } } });
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('E-posta'), 'x@example.com');
    await userEvent.type(screen.getByLabelText('Şifre'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı.');
    expect(tokenStore.get()).toBeNull();
  });

  it('fills the e-mail from a demo account button', async () => {
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Psikolog' }));
    expect(screen.getByLabelText('E-posta')).toHaveValue('elif.arslan@example.com');
  });

  it('keeps a child out of the parent and specialist screens', async () => {
    tokenStore.set('tok');
    mockFetch(baseRoutes(childUser));
    renderApp('/children/1');
    expect(await screen.findByRole('heading', { name: 'Merhaba Deniz!' })).toBeInTheDocument();
  });

  it('keeps a parent out of the child screen', async () => {
    tokenStore.set('tok');
    mockFetch(baseRoutes(parentUser));
    renderApp('/my');
    expect(await screen.findByRole('heading', { name: 'Deniz Yıldız' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Merhaba/ })).not.toBeInTheDocument();
  });

  it('shows the API error when a specialist opens a child they are not linked to', async () => {
    tokenStore.set('tok');
    mockFetch({
      'GET /auth/me': { user: specialistUser },
      'GET /children/9': { status: 403, body: { error: 'Bu çocuk için bu işleme yetkiniz yok.' } },
    });
    renderApp('/children/9');
    expect(await screen.findByRole('alert')).toHaveTextContent('yetkiniz yok');
    expect(screen.getByRole('link', { name: 'Çocuk listesine dön' })).toBeInTheDocument();
  });

  it('logs out and returns to the login page', async () => {
    tokenStore.set('tok');
    mockFetch(baseRoutes(childUser));
    renderApp('/my');
    await userEvent.click(await screen.findByRole('button', { name: 'Çıkış' }));
    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
  });

  it('drops an invalid saved session', async () => {
    tokenStore.set('expired');
    mockFetch({ 'GET /auth/me': { status: 401, body: { error: 'Oturum geçersiz.' } } });
    renderApp('/children');
    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    await waitFor(() => expect(tokenStore.get()).toBeNull());
  });

  it('lists several children for a specialist and links to each', async () => {
    tokenStore.set('tok');
    mockFetch({
      'GET /auth/me': { user: specialistUser },
      'GET /children': { children: [childRecord, { id: 2, name: 'Ece Korkmaz', grade: '3. sınıf', parentId: 2 }] },
    });
    renderApp('/children');
    expect(await screen.findByRole('link', { name: 'Aç: Ece Korkmaz' })).toHaveAttribute('href', '/children/2');
  });

  it('tells a specialist without links that nothing is linked yet', async () => {
    tokenStore.set('tok');
    mockFetch({ 'GET /auth/me': { user: specialistUser }, 'GET /children': { children: [] } });
    renderApp('/children');
    expect(await screen.findByText(/Henüz size bağlanmış bir çocuk yok/)).toBeInTheDocument();
  });
});
