import { DateFormat } from '../types';

export function formatDate(dateString: string, format: DateFormat): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const monthNum = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[date.getMonth()];

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${monthNum}/${year}`;
    case 'DD Month YYYY':
      return `${day} ${monthName} ${year}`;
    case 'Month DD, YYYY':
      return `${monthName} ${day}, ${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${monthNum}-${day}`;
    default:
      return `${day}/${monthNum}/${year}`;
  }
}

export function getTodayFormatted(format: DateFormat): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return formatDate(`${yyyy}-${mm}-${dd}`, format);
}
