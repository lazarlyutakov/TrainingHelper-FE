const pad = (n: number) => n.toString().padStart(2, '0');

/** Parses an ISO string; date-only values ("yyyy-mm-dd") are treated as local dates to avoid a timezone day-shift. */
function parse(value: string | number | Date): Date {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

/** Formats as dd/mm/yyyy. */
export function formatDate(value: string | number | Date): string {
  const d = parse(value);
  if (isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Formats as dd/mm/yyyy HH:mm (24h, local time). */
export function formatDateTime(value: string | number | Date): string {
  const d = parse(value);
  if (isNaN(d.getTime())) return '—';
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses dd/mm/yyyy (also accepts '.' or '-' separators) into yyyy-mm-dd; returns '' if invalid. */
export function parseDisplayDate(text: string): string {
  const m = /^\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\s*$/.exec(text ?? '');
  if (!m) return '';
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return '';
  return `${year}-${pad(month)}-${pad(day)}`;
}
