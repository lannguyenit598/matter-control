import { LocalizedText } from '@/components/molecules/localized-text'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'

import type { MatterMember } from '../schemas'

import { GrantMatterMemberForm } from './grant-matter-member-form'
import { RevokeMatterMemberButton } from './revoke-matter-member-button'

export function MatterMembers({
  matterId,
  members,
  etag,
  canAdminister,
}: {
  matterId: string
  members: MatterMember[]
  etag: string
  canAdminister: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <LocalizedText en="Matter members" vi="Thành viên hồ sơ" />
        </CardTitle>
        <CardDescription>
          <LocalizedText
            en="Access to this matter is explicit and separate from workspace membership."
            vi="Quyền truy cập hồ sơ được cấp rõ ràng, tách biệt với tư cách thành viên không gian làm việc."
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
                {canAdminister && (
                  <RevokeMatterMemberButton matterId={matterId} userId={m.userId} ifMatch={etag} />
                )}
              </div>
            </li>
          ))}
        </ul>
        {canAdminister && <GrantMatterMemberForm matterId={matterId} ifMatch={etag} />}
      </CardContent>
    </Card>
  )
}
