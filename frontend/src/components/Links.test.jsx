import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Links from './Links.jsx';
import { mockFetch } from '../testUtils.jsx';

afterEach(() => vi.unstubAllGlobals());

const links = [
  {
    specialistId: 5,
    name: 'Murat Kaya',
    email: 'murat.kaya@example.com',
    specialty: 'teacher',
    linkedAt: '2026-10-01T10:00:00.000Z',
  },
];

describe('Links (M2)', () => {
  it('lists the linked specialists', async () => {
    mockFetch({ 'GET /children/1/links': { links } });
    render(<Links childId={1} childName="Deniz" />);
    expect(await screen.findByText('Murat Kaya')).toBeInTheDocument();
    expect(screen.getByText('Öğretmen', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText(/murat.kaya@example.com/)).toBeInTheDocument();
  });

  it('links a specialist by e-mail and type', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/links': { links },
      'POST /children/1/links': { status: 201, body: { link: links[0] } },
    });
    render(<Links childId={1} childName="Deniz" />);
    await userEvent.type(await screen.findByLabelText('Uzmanın e-postası'), 'can.demir@example.com');
    await userEvent.selectOptions(screen.getByLabelText('Uzman türü'), 'coach');
    await userEvent.click(screen.getByRole('button', { name: 'Bağla' }));

    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({ email: 'can.demir@example.com', specialty: 'coach' });
  });

  it('shows an error for an unregistered e-mail', async () => {
    mockFetch({
      'GET /children/1/links': { links: [] },
      'POST /children/1/links': {
        status: 404,
        body: { error: 'Bu e-posta ile kayıtlı bir uzman bulunamadı. Uzmandan önce sisteme kaydolmasını isteyin.' },
      },
    });
    render(<Links childId={1} childName="Deniz" />);
    await userEvent.type(await screen.findByLabelText('Uzmanın e-postası'), 'ayse.kilic@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Bağla' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('kayıtlı bir uzman bulunamadı');
  });

  it('asks for confirmation before unlinking, and can be cancelled', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/links': { links },
      'DELETE /children/1/links/5': { status: 204, body: null },
    });
    render(<Links childId={1} childName="Deniz" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Kaldır: Murat Kaya' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('bağlantısı kaldırılsın mı');
    expect(fetchMock.mock.calls.some(([, init]) => init && init.method === 'DELETE')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Kaldır: Murat Kaya' }));
    await userEvent.click(screen.getByRole('button', { name: 'Evet, kaldır' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/children/1/links/5', expect.objectContaining({ method: 'DELETE' }));
  });

  it('shows an error when unlinking fails', async () => {
    mockFetch({
      'GET /children/1/links': { links },
      'DELETE /children/1/links/5': { status: 404, body: { error: 'Bu uzman bu çocuğa bağlı değil.' } },
    });
    render(<Links childId={1} childName="Deniz" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Kaldır: Murat Kaya' }));
    await userEvent.click(screen.getByRole('button', { name: 'Evet, kaldır' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('bağlı değil');
  });
});
