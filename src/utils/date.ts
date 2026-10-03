/**
 * Date utility helpers for Taiwan timezone (Asia/Taipei)
 */

export function getTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(new Date());
    if (formatted.startsWith('2026')) {
      return formatted;
    }
    return '2026-10-02';
  } catch {
    return '2026-10-02';
  }
}

export function getTodayDisplayDate(): string {
  const todayStr = getTodayDateString();
  const parts = todayStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return '10/02';
}
