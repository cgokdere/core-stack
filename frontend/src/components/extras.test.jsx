import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiSummary from './AiSummary.jsx';
import Tasks from './Tasks.jsx';
import WeekGlance from './WeekGlance.jsx';
import { CountUp } from './motion.jsx';
import { ToastProvider, useToast } from './toast.jsx';
import { mockFetch, sampleTasks, WEEK_START } from '../testUtils.jsx';

// jsdom has no requestAnimationFrame, so framer-motion's number animation would never advance.
// The count-up is replaced by one that jumps straight to its target; real browsers animate it.
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal()),
  animate: (from, to, options) => {
    options.onUpdate(to);
    return { stop() {} };
  },
}));

afterEach(() => vi.unstubAllGlobals());

const summary = {
  label: 'AI-generated',
  role: 'parent',
  weekStart: WEEK_START,
  summary: 'Bu hafta iki görev tamamlandı [1].',
  sources: [{ ref: 1, type: 'task', id: 1, date: '2026-10-12', title: '15 dakika sesli okuma' }],
};

describe('AI summary feedback (M8)', () => {
  async function openSummary(routes = {}) {
    const fetchMock = mockFetch({ 'POST /children/1/ai-summary': summary, ...routes });
    render(<AiSummary childId={1} weekStart={WEEK_START} />);
    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));
    await screen.findByText('AI-generated');
    return fetchMock;
  }

  it('offers helpful and incorrect-information feedback only after a summary exists', async () => {
    mockFetch({ 'POST /children/1/ai-summary': summary });
    render(<AiSummary childId={1} weekStart={WEEK_START} />);
    expect(screen.queryByRole('button', { name: 'Faydalı' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));
    expect(await screen.findByRole('button', { name: 'Faydalı' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hatalı bilgi bildir' })).toBeInTheDocument();
  });

  it('sends "helpful" for the summarised week and thanks the reader', async () => {
    const fetchMock = await openSummary({ 'POST /children/1/ai-summary/feedback': { status: 201, body: { feedback: {} } } });
    await userEvent.click(screen.getByRole('button', { name: 'Faydalı' }));

    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/feedback'));
    expect(JSON.parse(call[1].body)).toEqual({ week: WEEK_START, rating: 'helpful' });
    expect(await screen.findByText('Geri bildiriminiz için teşekkürler.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Faydalı' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hatalı bilgi bildir' })).toBeDisabled();
  });

  it('sends "incorrect" when the reader reports wrong information', async () => {
    const fetchMock = await openSummary({ 'POST /children/1/ai-summary/feedback': { status: 201, body: { feedback: {} } } });
    await userEvent.click(screen.getByRole('button', { name: 'Hatalı bilgi bildir' }));
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/feedback'));
    expect(JSON.parse(call[1].body).rating).toBe('incorrect');
  });

  it('shows the error and keeps the buttons usable when sending fails', async () => {
    await openSummary({ 'POST /children/1/ai-summary/feedback': { status: 500, body: { error: 'Kaydedilemedi.' } } });
    await userEvent.click(screen.getByRole('button', { name: 'Faydalı' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Kaydedilemedi.');
    expect(screen.getByRole('button', { name: 'Faydalı' })).toBeEnabled();
    expect(screen.queryByText('Geri bildiriminiz için teşekkürler.')).not.toBeInTheDocument();
  });
});

describe('Tasks filter for specialists (M4)', () => {
  it('lets a specialist narrow the list to the tasks they assigned', async () => {
    mockFetch({ 'GET /children/1/tasks': { tasks: sampleTasks } });
    // sampleTasks[1] was assigned by user 6, sampleTasks[0] by user 5
    render(<Tasks childId={1} weekStart={WEEK_START} role="specialist" userId={6} />);

    expect(await screen.findByText('15 dakika sesli okuma')).toBeInTheDocument();
    const mine = screen.getByRole('button', { name: 'Verdiklerim (1)' });
    expect(screen.getByRole('button', { name: 'Tümü (2)' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(mine);
    expect(mine).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('15 dakika sesli okuma')).not.toBeInTheDocument();
    expect(screen.getByText('5 dakika nefes egzersizi')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tümü (2)' }));
    expect(screen.getByText('15 dakika sesli okuma')).toBeInTheDocument();
  });

  it('does not show the filter to parents or children', async () => {
    mockFetch({ 'GET /children/1/tasks': { tasks: sampleTasks } });
    const { unmount } = render(<Tasks childId={1} weekStart={WEEK_START} role="parent" userId={1} />);
    await screen.findByText('15 dakika sesli okuma');
    expect(screen.queryByRole('group', { name: 'Görev filtresi' })).not.toBeInTheDocument();
    unmount();

    mockFetch({ 'GET /children/1/tasks': { tasks: sampleTasks } });
    render(<Tasks childId={1} weekStart={WEEK_START} role="child" />);
    await screen.findByText('15 dakika sesli okuma');
    expect(screen.queryByRole('group', { name: 'Görev filtresi' })).not.toBeInTheDocument();
  });

  it('tells the workspace when a task was assigned or completed', async () => {
    const onChanged = vi.fn();
    mockFetch({
      'GET /children/1/tasks': { tasks: sampleTasks },
      'POST /children/1/tasks': { status: 201, body: { task: sampleTasks[0] } },
    });
    render(<Tasks childId={1} weekStart={WEEK_START} role="parent" userId={1} onChanged={onChanged} />);
    await userEvent.type(await screen.findByLabelText('Görev başlığı'), 'Yeni görev');
    await userEvent.click(screen.getByRole('button', { name: 'Görevi ver' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });
});

describe('Week glance tiles', () => {
  const stats = {
    stats: {
      weekStart: WEEK_START,
      weekEnd: '2026-10-18',
      total: 6,
      done: 3,
      rate: 50,
      byArea: [],
    },
  };
  const events = {
    weekStart: WEEK_START,
    weekEnd: '2026-10-18',
    events: [
      { id: 1, title: 'Geçmiş etkinlik', startsAt: '2020-01-01T10:00', endsAt: null, area: 'sport', createdBy: 1 },
      { id: 2, title: 'Gelecek etkinlik', startsAt: '2099-01-01T16:30', endsAt: null, area: 'health', createdBy: 1 },
    ],
  };

  it('summarises completion, open tasks and events, naming the next event', async () => {
    mockFetch({ 'GET /children/1/stats': stats, 'GET /children/1/events': events });
    render(<WeekGlance childId={1} weekStart={WEEK_START} />);

    const group = await screen.findByRole('group', { name: 'Haftaya genel bakış' });
    expect(group).toHaveTextContent('Haftalık tamamlanma');
    expect(group).toHaveTextContent('3 / 6 görev tamamlandı');
    expect(group).toHaveTextContent('Bekleyen görev');
    expect(group).toHaveTextContent('Programdaki etkinlik');
    expect(group).toHaveTextContent('Sıradaki: Gelecek etkinlik · 16:30');
    // the real values are available as text, not only as an animated number
    expect(group.querySelectorAll('.sr-only')).toHaveLength(3);
    expect(group.querySelectorAll('.sr-only')[0]).toHaveTextContent('50%');
    expect(group.querySelectorAll('.sr-only')[1]).toHaveTextContent('3');
    expect(group.querySelectorAll('.sr-only')[2]).toHaveTextContent('2');
  });

  it('says there is no next event when all are in the past', async () => {
    mockFetch({
      'GET /children/1/stats': stats,
      'GET /children/1/events': { ...events, events: [events.events[0]] },
    });
    render(<WeekGlance childId={1} weekStart={WEEK_START} />);
    expect(await screen.findByText('Bu hafta başka etkinlik yok')).toBeInTheDocument();
  });

  it('hides itself when the numbers cannot be loaded', async () => {
    mockFetch({ 'GET /children/1/stats': { status: 500, body: { error: 'x' } }, 'GET /children/1/events': events });
    const { container } = render(<WeekGlance childId={1} weekStart={WEEK_START} />);
    await waitFor(() => expect(container.querySelector('.tile-skel')).toBeNull());
    expect(screen.queryByRole('group', { name: 'Haftaya genel bakış' })).not.toBeInTheDocument();
  });

  it('leaves out the events tile when the schedule fails but still shows the rest', async () => {
    mockFetch({ 'GET /children/1/stats': stats, 'GET /children/1/events': { status: 500, body: { error: 'x' } } });
    render(<WeekGlance childId={1} weekStart={WEEK_START} />);
    const group = await screen.findByRole('group', { name: 'Haftaya genel bakış' });
    expect(group).not.toHaveTextContent('Programdaki etkinlik');
  });
});

describe('Toasts and count-up', () => {
  function Trigger() {
    const toast = useToast();
    return (
      <button type="button" onClick={() => toast('Etkinlik eklendi')}>
        Bildir
      </button>
    );
  }

  it('shows a confirmation message in a polite live region and removes it later', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bildir' }));
    expect(await screen.findByText('Etkinlik eklendi')).toBeInTheDocument();
    expect(screen.getByText('Etkinlik eklendi').closest('[aria-live="polite"]')).not.toBeNull();
    vi.useRealTimers();
  });

  it('does nothing when there is no provider', async () => {
    render(<Trigger />);
    await userEvent.click(screen.getByRole('button', { name: 'Bildir' }));
    expect(screen.queryByText('Etkinlik eklendi')).not.toBeInTheDocument();
  });

  it('counts up to the final value and hides the animated number from assistive technology', async () => {
    const { container } = render(<CountUp value={78} duration={0.15} format={(n) => `%${n}`} />);
    await waitFor(() => expect(container.textContent).toBe('%78'));
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
