import React, { useRef, useState } from 'react';
import { api, fetchBlob } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatDate } from '../lib/dates.js';
import { DOC_TYPES, DOC_TYPE_LABELS, formatSize } from '../lib/labels.js';
import { EmptyState, ErrorMessage, Loading } from './ui.jsx';
import { DownloadIcon, EyeIcon, FolderIcon, UploadIcon, fileIconFor } from './icons.jsx';
import { useToast } from './toast.jsx';

// M6 - PDF and image documents. Parent and linked specialists only.
export default function Documents({ childId }) {
  const { data, error, loading, reload } = useLoad(() => api.get(`/children/${childId}/documents`), [childId]);
  const [docType, setDocType] = useState('report');
  const [actionError, setActionError] = useState('');
  const fileInput = useRef(null);
  const toast = useToast();
  const documents = data ? data.documents : [];

  async function upload(e) {
    e.preventDefault();
    setActionError('');
    const file = fileInput.current && fileInput.current.files[0];
    if (!file) {
      setActionError('Yüklenecek bir dosya seçin.');
      return;
    }
    const form = new FormData();
    form.append('docType', docType);
    form.append('file', file);
    try {
      await api.upload(`/children/${childId}/documents`, form);
      fileInput.current.value = '';
      reload();
      toast('Belge yüklendi');
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function open(doc, inline) {
    setActionError('');
    try {
      const blob = await fetchBlob(`/children/${childId}/documents/${doc.id}/download${inline ? '?inline=1' : ''}`);
      const url = URL.createObjectURL(blob);
      if (inline) {
        window.open(url, '_blank', 'noopener');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section aria-labelledby="documents-title" className="card">
      <h2 id="documents-title">Belgeler</h2>
      <Loading loading={loading && !data} />
      <ErrorMessage message={error || actionError} />
      {!loading && documents.length === 0 && <EmptyState icon={FolderIcon}>Henüz belge yok.</EmptyState>}
      {documents.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Belge</th>
                <th>Tür</th>
                <th>Yükleyen</th>
                <th>Tarih</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const Icon = fileIconFor(doc.mimeType);
                return (
                  <tr key={doc.id}>
                    <td>
                      <span className="doc-name">
                        <span className={doc.mimeType.startsWith('image/') ? 'doc-icon image' : 'doc-icon'}>
                          <Icon size={17} />
                        </span>
                        {doc.name}
                      </span>{' '}
                      <span className="muted small num">{formatSize(doc.size)}</span>
                    </td>
                    <td>{DOC_TYPE_LABELS[doc.docType]}</td>
                    <td>{doc.uploaderName}</td>
                    <td className="num">{formatDate(doc.createdAt.slice(0, 10))}</td>
                    <td className="actions">
                      <button type="button" onClick={() => open(doc, true)} aria-label={`Görüntüle: ${doc.name}`}>
                        <EyeIcon size={15} />
                        Görüntüle
                      </button>
                      <button type="button" onClick={() => open(doc, false)} aria-label={`İndir: ${doc.name}`}>
                        <DownloadIcon size={15} />
                        İndir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={upload} className="form" aria-label="Belge yükle">
        <h3>Belge yükle</h3>
        <label>
          Dosya (PDF, JPG veya PNG, en fazla 10 MB)
          <input type="file" ref={fileInput} accept="application/pdf,image/png,image/jpeg" />
        </label>
        <label>
          Belge türü
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="primary">
          <UploadIcon size={17} />
          Yükle
        </button>
      </form>
    </section>
  );
}
