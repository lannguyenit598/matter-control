import { LocalizedText } from '@/components/molecules/localized-text'

/** Display text for the API's matter role enums; unknown values pass through unchanged. */
export function MatterRoleLabel({ role }: { role: string }) {
  if (role === 'OWNER') return <LocalizedText en="Owner" vi="Chủ sở hữu" />
  if (role === 'EDITOR') return <LocalizedText en="Editor" vi="Biên tập viên" />
  if (role === 'VIEWER') return <LocalizedText en="Viewer" vi="Người xem" />
  return role
}
