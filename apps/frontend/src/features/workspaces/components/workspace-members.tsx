import { Badge } from '@/components/atoms/badge'
import { ListSection, LIST_CLASS, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { Member } from '../schemas'

import { GrantWorkspaceMemberForm } from './grant-workspace-member-form'
import { WorkspaceRoleLabel } from './role-label'
import { RevokeWorkspaceMemberButton } from './revoke-workspace-member-button'

/** Workspace membership administration. Rendered only for OWNERs; the API enforces it regardless. */
export function WorkspaceMembers({
  workspaceId,
  members,
  etag,
  currentUserId,
}: {
  workspaceId: string
  members: Member[]
  etag: string
  currentUserId?: string
}) {
  return (
    <ListSection
      title={<LocalizedText en="Workspace members" vi="Thành viên không gian làm việc" />}
      count={members.length}
      description={
        <LocalizedText
          en="Removing a workspace member immediately removes their access to every matter in it."
          vi="Gỡ thành viên khỏi không gian làm việc sẽ chấm dứt ngay quyền truy cập mọi hồ sơ trong đó."
        />
      }
      action={<GrantWorkspaceMemberForm workspaceId={workspaceId} ifMatch={etag} />}
    >
      <ul className={LIST_CLASS}>
        {members.map((m) => (
          <li key={m.userId} className={ROW_CLASS}>
            <span className="min-w-0 font-medium break-words">{m.displayName}</span>
            <span className="flex items-center gap-3">
              <Badge variant={m.role === 'OWNER' ? 'primary' : 'neutral'}>
                <WorkspaceRoleLabel role={m.role} />
              </Badge>
              <RevokeWorkspaceMemberButton
                workspaceId={workspaceId}
                userId={m.userId}
                ifMatch={etag}
                self={m.userId === currentUserId}
              />
            </span>
          </li>
        ))}
      </ul>
    </ListSection>
  )
}
