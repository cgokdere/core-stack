export const AREA_LABELS = {
  academic: 'Akademik',
  social: 'Sosyal-duygusal',
  health: 'Sağlık',
  sport: 'Spor',
};

export const SPECIALTY_LABELS = {
  teacher: 'Öğretmen',
  psychologist: 'Psikolog',
  doctor: 'Doktor',
  special_education: 'Özel eğitim öğretmeni',
  coach: 'Antrenör',
};

export const DOC_TYPE_LABELS = {
  report: 'Rapor',
  evaluation: 'Değerlendirme',
  health: 'Sağlık',
  form: 'Form',
  other: 'Diğer',
};

export const ROLE_LABELS = {
  parent: 'Aile',
  specialist: 'Uzman',
  child: 'Çocuk',
};

export const SOURCE_TYPE_LABELS = {
  entry: 'Uzman girdisi',
  event: 'Etkinlik',
  task: 'Görev',
};

export const AREAS = Object.keys(AREA_LABELS);
export const SPECIALTIES = Object.keys(SPECIALTY_LABELS);
export const DOC_TYPES = Object.keys(DOC_TYPE_LABELS);

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('tr'))
    .join('');
}

const TONES = ['', 'sand', 'rose', 'sky', 'sage'];

// A stable avatar colour per person, so the same name always looks the same.
export function avatarTone(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return TONES[hash % TONES.length];
}
