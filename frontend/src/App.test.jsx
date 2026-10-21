import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

afterEach(() => vi.unstubAllGlobals());

describe('App (walking skeleton)', () => {
  it('shows the title', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Gelişim Ağı' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Backend kontrol ediliyor…');
  });

  it('shows that the backend answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 })));
    render(<App />);
    expect(await screen.findByText('Backend çalışıyor')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/health');
  });

  it('shows when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    render(<App />);
    expect(await screen.findByText('Backend’e ulaşılamıyor')).toBeInTheDocument();
  });

  it('shows when the request fails completely', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    render(<App />);
    expect(await screen.findByText('Backend’e ulaşılamıyor')).toBeInTheDocument();
  });
});
