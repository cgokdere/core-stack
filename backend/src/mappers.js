const toUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  specialty: u.specialty,
});

const toChild = (c) => ({ id: c.id, name: c.name, grade: c.grade, parentId: c.parent_id });

const toEvent = (e) => ({
  id: e.id,
  title: e.title,
  startsAt: e.starts_at,
  endsAt: e.ends_at,
  area: e.area,
  createdBy: e.created_by,
});

const toTask = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  area: t.area,
  dueDate: t.due_date,
  status: t.status,
  doneAt: t.done_at,
  assignedBy: t.assigned_by,
  assignerName: t.assigner_name,
});

const toEntry = (e) => ({
  id: e.id,
  entryDate: e.entry_date,
  title: e.title,
  body: e.body,
  area: e.area,
  edited: e.edited === 1,
  editedAt: e.edited_at,
  authorId: e.author_id,
  authorName: e.author_name,
  authorSpecialty: e.author_specialty,
});

const toDocument = (d) => ({
  id: d.id,
  name: d.original_name,
  mimeType: d.mime_type,
  size: d.size,
  docType: d.doc_type,
  uploaderId: d.uploader_id,
  uploaderName: d.uploader_name,
  createdAt: d.created_at,
});

module.exports = { toUser, toChild, toEvent, toTask, toEntry, toDocument };
