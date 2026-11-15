import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Schedule from './Schedule.jsx';
import Stats from './Stats.jsx';
import { mockFetch, WEEK_START } from '../testUtils.jsx';

afterEach(() => vi.unstubAllGlobals());

const events = [
  { id: 1, title: 'Özel eğitim seansı', startsAt: '2026-10-12T16:00', endsAt: '2026-10-12T17:00', area: 'academic', createdBy: 7 },
  { id: 2, title: 'Yüzme antrenmanı', startsAt: '2026-10-13T17:30', endsAt: null, area: 'sport', createdBy: 1 },
];

describe('Schedule (M3)', () => {
  it('lists the week\'s events under their days', async () => {
    mockFetch({ 'GET /children/1/events': { weekStart: WEEK_START, weekEnd: '2026-10-18', events } });
    render(<Schedule childId={1} weekStart={WEEK_START} canAdd={false} />);

    expect(await screen.findByText('Özel eğitim seansı')).toBeInTheDocument();
    const monday = screen.getByRole('heading', { name: /Pzt/ }).closest('.day');
    expect(within(monday).getByText('16:00')).toBeInTheDocument();
    expect(within(monday).getByText('Özel eğitim seansı')).toBeInTheDocument();
    const tuesday = screen.getByRole('heading', { name: /Sal/ }).closest('.day');
    expect(within(tuesday).getByText('Yüzme antrenmanı')).toBeInTheDocument();
    expect(screen.getAllByText('Etkinlik yok')).toHaveLength(5);
    expect(screen.queryByRole('form', { name: 'Etkinlik ekle' })).not.toBeInTheDocument();
  });

  it('adds an event for the selected day and time', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/events': { weekStart: WEEK_START, weekEnd: '2026-10-18', events: [] },
      'POST /children/1/events': { status: 201, body: { event: events[0] } },
    });
    render(<Schedule childId={1} weekStart={WEEK_START} canAdd />);

    await userEvent.type(await screen.findByLabelText('Etkinlik başlığı'), 'Kitap kulübü');
    await userEvent.click(screen.getByRole('button', { name: 'Etkinliği ekle' }));

    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({
      title: 'Kitap kulübü',
      startsAt: `${WEEK_START}T16:00`,
      area: 'academic',
    });
  });

  it('sends an end time when one is given and shows API errors', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/events': { weekStart: WEEK_START, weekEnd: '2026-10-18', events: [] },
      'POST /children/1/events': { status: 400, body: { error: 'Bitiş zamanı geçersiz veya başlangıçtan önce.' } },
    });
    render(<Schedule childId={1} weekStart={WEEK_START} canAdd />);
    await userEvent.type(await screen.findByLabelText('Etkinlik başlığı'), 'X');
    await userEvent.type(screen.getByLabelText('Bitiş saati'), '10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Etkinliği ekle' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bitiş zamanı geçersiz');
    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(JSON.parse(post[1].body).endsAt).toBe(`${WEEK_START}T10:00`);
  });

  it('shows a load error', async () => {
    mockFetch({ 'GET /children/1/events': { status: 403, body: { error: 'Yetkiniz yok.' } } });
    render(<Schedule childId={1} weekStart={WEEK_START} canAdd={false} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Yetkiniz yok.');
  });
});

describe('Stats (M7)', () => {
  it('shows the completion rate in total and by area', async () => {
    mockFetch({
      'GET /children/1/stats': {
        stats: {
          weekStart: WEEK_START,
          weekEnd: '2026-10-18',
          total: 6,
          done: 3,
          rate: 50,
          byArea: [
            { area: 'academic', total: 3, done: 2, rate: 67 },
            { area: 'social', total: 1, done: 0, rate: 0 },
            { area: 'health', total: 1, done: 0, rate: 0 },
            { area: 'sport', total: 1, done: 1, rate: 100 },
          ],
        },
      },
    });
    render(<Stats childId={1} weekStart={WEEK_START} />);
    expect(await screen.findByTestId('total-rate')).toHaveTextContent('%50');
    expect(screen.getByTestId('total-count')).toHaveTextContent('3 / 6 görev tamamlandı');
    expect(screen.getByTestId('area-academic')).toHaveTextContent('Akademik');
    expect(screen.getByTestId('area-academic')).toHaveTextContent('2/3');
    expect(screen.getByTestId('area-sport')).toHaveTextContent('1/1');
  });

  it('shows an error when the statistics cannot be loaded', async () => {
    mockFetch({ 'GET /children/1/stats': { status: 403, body: { error: 'Yetkiniz yok.' } } });
    render(<Stats childId={1} weekStart={WEEK_START} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Yetkiniz yok.');
  });
});
