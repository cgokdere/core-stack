import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Entries from './Entries.jsx';
import { mockFetch, parentUser, specialistUser } from '../testUtils.jsx';

afterEach(() => vi.unstubAllGlobals());

const entries = [
  {
    id: 1,
    entryDate: '2026-10-14',
    title: 'Görüşme notu',
    body: 'Nefes egzersizi işe yaradı.',
    area: 'health',
    edited: true,
    editedAt: '2026-10-15T10:00:00.000Z',
    authorId: 6,
    authorName: 'Elif Arslan',
    authorSpecialty: 'psychologist',
  },
  {
    id: 2,
    entryDate: '2026-10-12',
    title: 'Derse katılım gözlemi',
    body: 'Tahtaya kalktı.',
    area: 'academic',
    edited: false,
    editedAt: null,
    authorId: 5,
    authorName: 'Murat Kaya',
    authorSpecialty: 'teacher',
  },
];

describe('Entries (M5)', () => {
  it('shows entries read-only to the parent, with the edited mark', async () => {
    mockFetch({ 'GET /children/1/entries': { entries } });
    render(<Entries childId={1} user={parentUser} />);

    expect(await screen.findByText('Görüşme notu')).toBeInTheDocument();
    expect(screen.getByText('Düzenlendi')).toBeInTheDocument();
    expect(screen.getAllByText('Düzenlendi')).toHaveLength(1);
    expect(screen.queryByRole('form', { name: 'Yeni girdi ekle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Düzenle:/ })).not.toBeInTheDocument();
  });

  it('lets a specialist add a dated observation', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/entries': { entries: [] },
      'POST /children/1/entries': { status: 201, body: { entry: entries[0] } },
    });
    render(<Entries childId={1} user={specialistUser} />);

    await userEvent.type(await screen.findByLabelText('Başlık'), 'Haftalık görüşme');
    await userEvent.type(screen.getByLabelText('Gözlem ve görüş'), 'İlerleme var.');
    await userEvent.click(screen.getByRole('button', { name: 'Girdiyi kaydet' }));

    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(JSON.parse(post[1].body)).toMatchObject({ title: 'Haftalık görüşme', body: 'İlerleme var.', area: 'academic' });
    expect(JSON.parse(post[1].body).entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('offers editing only for the specialist\'s own entries', async () => {
    mockFetch({ 'GET /children/1/entries': { entries } });
    render(<Entries childId={1} user={specialistUser} />);
    await screen.findByText('Görüşme notu');
    expect(screen.getByRole('button', { name: 'Düzenle: Görüşme notu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Düzenle: Derse katılım gözlemi' })).not.toBeInTheDocument();
  });

  it('saves an edit with PUT and can cancel it', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/entries': { entries },
      'PUT /children/1/entries/1': { entry: entries[0] },
    });
    render(<Entries childId={1} user={specialistUser} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Düzenle: Görüşme notu' }));

    const form = screen.getByRole('form', { name: 'Girdiyi düzenle' });
    await userEvent.click(within(form).getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('form', { name: 'Girdiyi düzenle' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Düzenle: Görüşme notu' }));
    const editForm = screen.getByRole('form', { name: 'Girdiyi düzenle' });
    const body = within(editForm).getByLabelText('Gözlem ve görüş');
    await userEvent.clear(body);
    await userEvent.type(body, 'Güncellendi');
    await userEvent.click(within(editForm).getByRole('button', { name: 'Değişiklikleri kaydet' }));

    const put = fetchMock.mock.calls.find(([, init]) => init && init.method === 'PUT');
    expect(put[0]).toBe('/api/children/1/entries/1');
    expect(JSON.parse(put[1].body).body).toBe('Güncellendi');
  });

  it('shows the API error when saving fails', async () => {
    mockFetch({
      'GET /children/1/entries': { entries: [] },
      'POST /children/1/entries': { status: 400, body: { error: 'Girdi tarihi geçersiz.' } },
    });
    render(<Entries childId={1} user={specialistUser} />);
    await userEvent.type(await screen.findByLabelText('Başlık'), 'X');
    await userEvent.type(screen.getByLabelText('Gözlem ve görüş'), 'Y');
    await userEvent.click(screen.getByRole('button', { name: 'Girdiyi kaydet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Girdi tarihi geçersiz.');
  });
});
