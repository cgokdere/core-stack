import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, fetchBlob, setUnauthorizedHandler, tokenStore } from './api.js';
import { mockFetch } from '../testUtils.jsx';

beforeEach(() => {
  localStorage.clear();
  setUnauthorizedHandler(null);
});
afterEach(() => vi.unstubAllGlobals());

describe('tokenStore', () => {
  it('stores and clears the token', () => {
    expect(tokenStore.get()).toBeNull();
    tokenStore.set('abc');
    expect(tokenStore.get()).toBe('abc');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const broken = () => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(broken);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(broken);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(broken);
    expect(tokenStore.get()).toBeNull();
    expect(() => tokenStore.set('x')).not.toThrow();
    expect(() => tokenStore.clear()).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe('api', () => {
  it('sends JSON with the bearer token', async () => {
    tokenStore.set('tok');
    const fetchMock = mockFetch({ 'POST /things': { ok: true } });
    await expect(api.post('/things', { a: 1 })).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/things');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('supports get, put, patch and delete, including empty 204 answers', async () => {
    mockFetch({
      'GET /a': { n: 1 },
      'PUT /a': { n: 2 },
      'PATCH /a': { n: 3 },
      'DELETE /a': { status: 204, body: null },
    });
    expect(await api.get('/a')).toEqual({ n: 1 });
    expect(await api.put('/a', {})).toEqual({ n: 2 });
    expect(await api.patch('/a')).toEqual({ n: 3 });
    expect(await api.delete('/a')).toBeNull();
  });

  it('uploads form data without a JSON content type', async () => {
    const fetchMock = mockFetch({ 'POST /up': { status: 201, body: { id: 1 } } });
    const form = new FormData();
    form.append('file', new Blob(['x']), 'x.pdf');
    await api.upload('/up', form);
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('throws ApiError with the server message', async () => {
    mockFetch({ 'GET /bad': { status: 403, body: { error: 'Yetkiniz yok.' } } });
    await expect(api.get('/bad')).rejects.toMatchObject({ status: 403, message: 'Yetkiniz yok.' });
    await expect(api.get('/bad')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when the answer is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })));
    await expect(api.get('/x')).rejects.toMatchObject({ status: 500, message: 'Beklenmeyen bir hata oluştu.' });
  });

  it('calls the unauthorized handler on 401 only when a token was sent', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch({ 'GET /me': { status: 401, body: { error: 'x' } } });
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
    tokenStore.set('old');
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('fetchBlob', () => {
  it('returns the file as a blob', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('%PDF', { status: 200 })));
    const blob = await fetchBlob('/file');
    // Which Blob class comes back differs between Node versions, so only its size is checked.
    expect(blob.size).toBe(4);
  });

  it('throws ApiError with the server message on failure', async () => {
    mockFetch({ 'GET /file': { status: 404, body: { error: 'Belge bulunamadı.' } } });
    await expect(fetchBlob('/file')).rejects.toMatchObject({ status: 404, message: 'Belge bulunamadı.' });
  });

  it('uses a default message when the failure has no JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    await expect(fetchBlob('/file')).rejects.toMatchObject({ message: 'Dosya alınamadı.' });
  });
});
