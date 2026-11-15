import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Tasks from './Tasks.jsx';
import { mockFetch, sampleTasks, WEEK_START } from '../testUtils.jsx';

afterEach(() => vi.unstubAllGlobals());

describe('Tasks (M4)', () => {
  it('lets the child mark an open task as done and reloads', async () => {
    let tasks = sampleTasks;
    const fetchMock = mockFetch({
      'GET /children/1/tasks': () => ({ tasks }),
      'PATCH /children/1/tasks/2/done': () => {
        tasks = tasks.map((t) => (t.id === 2 ? { ...t, status: 'done' } : t));
        return { task: tasks[1] };
      },
    });
    render(<Tasks childId={1} weekStart={WEEK_START} role="child" />);

    const button = await screen.findByRole('button', { name: 'Yaptım: 5 dakika nefes egzersizi' });
    expect(screen.queryByRole('form', { name: 'Görev ver' })).not.toBeInTheDocument();
    await userEvent.click(button);

    expect(await screen.findAllByText('Tamamlandı')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/children/1/tasks/2/done', expect.objectContaining({ method: 'PATCH' }));
  });

  it('shows the assigner and the status to an assigning parent, with a form to assign', async () => {
    mockFetch({ 'GET /children/1/tasks': { tasks: sampleTasks } });
    render(<Tasks childId={1} weekStart={WEEK_START} role="parent" />);

    expect(await screen.findByText(/Murat Kaya verdi/)).toBeInTheDocument();
    expect(screen.getByTestId('status-1')).toHaveTextContent('Tamamlandı');
    expect(screen.getByTestId('status-2')).toHaveTextContent('Bekliyor');
    expect(screen.queryByRole('button', { name: /Yaptım/ })).not.toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Görev ver' })).toBeInTheDocument();
  });

  it('assigns a task with title, description, area and due date', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/tasks': { tasks: [] },
      'POST /children/1/tasks': { status: 201, body: { task: sampleTasks[0] } },
    });
    render(<Tasks childId={1} weekStart={WEEK_START} role="parent" />);

    await userEvent.type(await screen.findByLabelText('Görev başlığı'), 'Şiir ezberle');
    await userEvent.type(screen.getByLabelText('Açıklama'), 'Dört dize');
    await userEvent.selectOptions(screen.getByLabelText('Gelişim alanı'), 'social');
    await userEvent.click(screen.getByRole('button', { name: 'Görevi ver' }));

    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({
      title: 'Şiir ezberle',
      description: 'Dört dize',
      area: 'social',
      dueDate: WEEK_START,
    });
  });

  it('shows the API error when assigning fails', async () => {
    mockFetch({
      'GET /children/1/tasks': { tasks: [] },
      'POST /children/1/tasks': { status: 400, body: { error: 'Son gün geçersiz.' } },
    });
    render(<Tasks childId={1} weekStart={WEEK_START} role="specialist" />);
    await userEvent.type(await screen.findByLabelText('Görev başlığı'), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Görevi ver' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Son gün geçersiz.');
  });

  it('shows an empty message and surfaces a failed completion', async () => {
    mockFetch({ 'GET /children/1/tasks': { tasks: [] } });
    const { unmount } = render(<Tasks childId={1} weekStart={WEEK_START} role="child" />);
    expect(await screen.findByText('Bu hafta için görev yok.')).toBeInTheDocument();
    unmount();

    mockFetch({
      'GET /children/1/tasks': { tasks: sampleTasks },
      'PATCH /children/1/tasks/2/done': { status: 500, body: { error: 'Sunucu hatası.' } },
    });
    render(<Tasks childId={1} weekStart={WEEK_START} role="child" />);
    await userEvent.click(await screen.findByRole('button', { name: /Yaptım/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucu hatası.');
  });
});
