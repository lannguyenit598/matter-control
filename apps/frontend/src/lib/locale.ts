export type UiLocale = 'en' | 'vi'

/** UI dates always name their display zone; changing interface language never changes a legal instant. */
export function formatUiInstant(
  iso: string,
  locale: UiLocale,
  timeZone: 'UTC' | 'Asia/Ho_Chi_Minh' = 'UTC',
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone,
    hourCycle: 'h23',
  }).format(date)
}
