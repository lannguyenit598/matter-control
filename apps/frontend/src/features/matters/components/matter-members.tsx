import { Badge } from '@/components/atoms/badge'
import { ListSection, LIST_CLASS, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { MatterMember } from '../schemas'

import { GrantMatterMemberForm } from './grant-matter-member-form'
import { MatterRoleLabel } from './role-label'
import { RevokeMatterMemberButton } from './revoke-matter-member-button'

export function MatterMembers({
  matterId,
  members,
  etag,
  canAdminister,
  candidates,
}: {
  matterId: string
  members: MatterMember[]
  etag: string
  canAdminister: boolean
  candidates: MatterMember[] | null
}) {
  return (
    <div id="matter-members" className="scroll-mt-20">
      <ListSection
        title={<LocalizedText en="Matter members" vi="Thành viên hồ sơ" />}
        count={members.length}
        description={
          <LocalizedText
            en="Access to this matter is explicit and separate from workspace membership."
            vi="Quyền truy cập hồ sơ được cấp rõ ràng, tách biệt với tư cách thành viên không gian làm việc."
          />
        }
        action={
          canAdminister &&
          (candidates ? (
            <GrantMatterMemberForm
              matterId={matterId}
              ifMatch={etag}
              candidates={candidates.filter(
                (person) => !members.some((member) => member.userId === person.userId),
              )}
            />
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              <LocalizedText
                en="Could not load people. Reload this page to try again."
                vi="Chưa tải được danh sách người dùng. Tải lại trang để thử lại."
              />
            </p>
          ))
        }
      >
        <ul className={LIST_CLASS}>
          {members.map((m) => (
            <li key={m.userId} className={ROW_CLASS}>
              <span className="min-w-0 font-medium break-words">{m.displayName}</span>
              <span className="flex items-center gap-3">
                <Badge variant={m.role === 'OWNER' ? 'primary' : 'neutral'}>
                  <MatterRoleLabel role={m.role} />
                </Badge>
                {canAdminister && (
                  <RevokeMatterMemberButton matterId={matterId} userId={m.userId} ifMatch={etag} />
                )}
              </span>
            </li>
          ))}
        </ul>
      </ListSection>
    </div>
  )
}
