import { LocalizedText } from '@/components/molecules/localized-text'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { RevokeWorkspaceMemberButton } from './revoke-workspace-member-button'
import { GrantWorkspaceMemberForm } from './grant-workspace-member-form'

import type { Member } from '../schemas'

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
    <Card>
      <CardHeader>
        <CardTitle>
          <LocalizedText en="Workspace members" vi="Thành viên không gian làm việc" />
        </CardTitle>
        <CardDescription>
          <LocalizedText
            en="Removing a workspace member immediately removes their access to every matter in it."
            vi="Gỡ thành viên khỏi không gian làm việc sẽ chấm dứt ngay quyền truy cập mọi hồ sơ trong đó."
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ul className="divide-y rounded-md border">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium break-words">{m.displayName}</span>
                <span className="font-mono text-xs break-all text-muted-foreground">
                  {m.userId}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.role === 'OWNER' ? 'primary' : 'neutral'}>{m.role}</Badge>
                <RevokeWorkspaceMemberButton
                  workspaceId={workspaceId}
                  userId={m.userId}
                  ifMatch={etag}
                  self={m.userId === currentUserId}
                />
              </div>
            </li>
          ))}
        </ul>
        <GrantWorkspaceMemberForm workspaceId={workspaceId} ifMatch={etag} />
      </CardContent>
    </Card>
  )
}
