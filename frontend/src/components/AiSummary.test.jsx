import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiSummary, { renderWithCitations } from './AiSummary.jsx';
import { mockFetch, WEEK_START } from '../testUtils.jsx';

afterEach(() => vi.unstubAllGlobals());

const result = {
  label: 'AI-generated',
  role: 'parent',
  summary: 'Bu hafta iki görev tamamlandı [2].\nUzman şunu yazdı [1]',
  sources: [
    { ref: 1, type: 'entry', id: 4, date: '2026-10-12', title: 'Derse katılım gözlemi' },
    { ref: 2, type: 'task', id: 1, date: '2026-10-12', title: '15 dakika sesli okuma' },
  ],
};

describe('AiSummary (M8)', () => {
  it('shows nothing until asked, then the labelled summary with linked sources', async () => {
    const fetchMock = mockFetch({ 'POST /children/1/ai-summary': result });
    render(<AiSummary childId={1} weekStart={WEEK_START} />);
    expect(screen.queryByText('AI-generated')).not.toBeInTheDocument();
    expect(screen.getByText(/karar vermez, teşhis veya tedavi önermez/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));

    expect(await screen.findByText('AI-generated')).toBeInTheDocument();
    expect(screen.getByText('Yapay zekâ tarafından üretildi')).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ week: WEEK_START });

    const citation = screen.getByRole('link', { name: '[2]' });
    expect(citation).toHaveAttribute('href', '#source-2');
    const sourceItems = screen.getAllByRole('listitem');
    expect(sourceItems).toHaveLength(2);
    expect(sourceItems[0]).toHaveAttribute('id', 'source-1');
    expect(sourceItems[0]).toHaveTextContent('Uzman girdisi · Derse katılım gözlemi');
  });

  it('shows the error when the summary cannot be produced and clears the old one on a week change', async () => {
    mockFetch({
      'POST /children/1/ai-summary': { status: 502, body: { error: 'AI özeti şu anda üretilemedi.' } },
    });
    const { rerender } = render(<AiSummary childId={1} weekStart={WEEK_START} />);
    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('üretilemedi');

    mockFetch({ 'POST /children/1/ai-summary': result });
    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));
    expect(await screen.findByText('AI-generated')).toBeInTheDocument();

    rerender(<AiSummary childId={1} weekStart="2026-10-19" />);
    expect(screen.queryByText('AI-generated')).not.toBeInTheDocument();
  });

  it('turns [n] references into links and leaves other text alone', () => {
    const { container } = render(<p>{renderWithCitations('A [1] ve B [12], [x]')}</p>);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[1]).toHaveAttribute('href', '#source-12');
    expect(container.textContent).toBe('A [1] ve B [12], [x]');
  });

  it('omits the source list when there are no sources', async () => {
    mockFetch({ 'POST /children/1/ai-summary': { ...result, summary: 'Kayıt yok.', sources: [] } });
    render(<AiSummary childId={1} weekStart={WEEK_START} />);
    await userEvent.click(screen.getByRole('button', { name: 'Özet oluştur' }));
    expect(await screen.findByText('Kayıt yok.')).toBeInTheDocument();
    expect(screen.queryByText('Dayanak kayıtlar')).not.toBeInTheDocument();
  });
});
