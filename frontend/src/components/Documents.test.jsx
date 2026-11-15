import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Documents from './Documents.jsx';
import { mockFetch } from '../testUtils.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const documents = [
  {
    id: 3,
    name: 'okul-raporu.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    docType: 'report',
    uploaderId: 1,
    uploaderName: 'Selin Yıldız',
    createdAt: '2026-10-14T09:00:00.000Z',
  },
];

describe('Documents (M6)', () => {
  it('lists documents with name, type, uploader and date', async () => {
    mockFetch({ 'GET /children/1/documents': { documents } });
    render(<Documents childId={1} />);
    expect(await screen.findByText('okul-raporu.pdf')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Rapor' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Selin Yıldız' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '14 Eki 2026' })).toBeInTheDocument();
  });

  it('says so when there are no documents', async () => {
    mockFetch({ 'GET /children/1/documents': { documents: [] } });
    render(<Documents childId={1} />);
    expect(await screen.findByText('Henüz belge yok.')).toBeInTheDocument();
  });

  it('asks for a file before uploading', async () => {
    mockFetch({ 'GET /children/1/documents': { documents: [] } });
    render(<Documents childId={1} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Yükle' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Yüklenecek bir dosya seçin.');
  });

  it('uploads the chosen file with its type', async () => {
    const fetchMock = mockFetch({
      'GET /children/1/documents': { documents: [] },
      'POST /children/1/documents': { status: 201, body: { document: documents[0] } },
    });
    render(<Documents childId={1} />);
    const file = new File(['%PDF-1.4'], 'rapor.pdf', { type: 'application/pdf' });
    await userEvent.upload(await screen.findByLabelText(/Dosya \(PDF/), file);
    await userEvent.selectOptions(screen.getByLabelText('Belge türü'), 'evaluation');
    await userEvent.click(screen.getByRole('button', { name: 'Yükle' }));

    const post = fetchMock.mock.calls.find(([, init]) => init && init.method === 'POST');
    expect(post[1].body.get('docType')).toBe('evaluation');
    expect(post[1].body.get('file').name).toBe('rapor.pdf');
  });

  it('shows the server error for a rejected upload', async () => {
    mockFetch({
      'GET /children/1/documents': { documents: [] },
      'POST /children/1/documents': { status: 400, body: { error: 'Yalnızca PDF, JPG veya PNG dosyaları yüklenebilir.' } },
    });
    render(<Documents childId={1} />);
    await userEvent.upload(await screen.findByLabelText(/Dosya \(PDF/), new File(['x'], 'a.txt', { type: 'text/plain' }), {
      applyAccept: false,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Yükle' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Yalnızca PDF');
  });

  it('downloads a document through an authorised request', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/download')) return new Response('%PDF-1.4', { status: 200 });
      return new Response(JSON.stringify({ documents }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<Documents childId={1} />);
    await userEvent.click(await screen.findByRole('button', { name: 'İndir: okul-raporu.pdf' }));

    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/children/1/documents/3/download', expect.anything());
  });

  it('opens a document inline in a new tab', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/download')) return new Response('%PDF-1.4', { status: 200 });
      return new Response(JSON.stringify({ documents }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<Documents childId={1} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Görüntüle: okul-raporu.pdf' }));

    await vi.waitFor(() => expect(open).toHaveBeenCalledWith('blob:fake', '_blank', 'noopener'));
    expect(fetchMock).toHaveBeenCalledWith('/api/children/1/documents/3/download?inline=1', expect.anything());
  });

  it('shows an error when a file cannot be fetched', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/download')) {
        return new Response(JSON.stringify({ error: 'Belge bulunamadı.' }), { status: 404 });
      }
      return new Response(JSON.stringify({ documents }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<Documents childId={1} />);
    await userEvent.click(await screen.findByRole('button', { name: 'İndir: okul-raporu.pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Belge bulunamadı.');
  });
});
