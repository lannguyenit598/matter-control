import { LocalizedText } from '@/components/molecules/localized-text'

import { LocalDateTimeField } from '@/components/molecules/local-datetime-field'

/**
 * A due date typed as wall-clock time in the device zone (BF-03). Read it with
 * `readLocalField(values, 'due', zone, current)`. Leave the time empty to clear it.
 */
export function DueField({ current, error }: { current: string | null; error?: string }) {
  return (
    <LocalDateTimeField
      name="due"
      current={current}
      error={error}
      label={<LocalizedText en="Due (date and time)" vi="Hạn (ngày và giờ)" />}
      hint={
        current ? undefined : (
          <LocalizedText en="Leave empty for no due date." vi="Để trống nếu chưa có hạn." />
        )
      }
    />
  )
}
