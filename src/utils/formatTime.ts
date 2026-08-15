/**
 * Timestamp formatting shared by the operations pages (Feedback, Food photos).
 *
 * Accepts either epoch millis or a parseable date string, because the API is
 * not consistent about it — feedback carries a localized `timestampString`,
 * food photos carry a number. Anything unparseable is returned as-is rather
 * than rendered as "Invalid Date"; a raw value at least tells you what the
 * server actually sent.
 */

const toMillis = (value: number | string): number =>
  typeof value === 'number' ? value : Date.parse(value);

/** "just now", "12m ago", "3d ago", then an absolute date past a month. */
export const formatRelative = (value: number | string): string => {
  const t = toMillis(value);
  if (Number.isNaN(t)) return String(value);
  const diffMs = Date.now() - t;
  const minutes = Math.round(diffMs / 60_000);
  const hours = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Full date and time, for tooltips and detail rows. */
export const formatAbsolute = (value: number | string): string => {
  const t = toMillis(value);
  if (Number.isNaN(t)) return String(value);
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
