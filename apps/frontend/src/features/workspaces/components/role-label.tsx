import { LocalizedText } from '@/components/molecules/localized-text'

/** Display text for the API's role enums; unknown values pass through unchanged. */
export function WorkspaceRoleLabel({ role }: { role: string }) {
  if (role === 'OWNER') return <LocalizedText en="Owner" vi="Chủ sở hữu" />
  if (role === 'MEMBER') return <LocalizedText en="Member" vi="Thành viên" />
  return role
}
