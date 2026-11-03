import 'server-only'

import { playbookRepository } from '../repository'
import type { PlaybookOption } from './option-type'
export type { PlaybookOption }

/**
 * Server-side assembly of the apply options: every published revision of the matter's
 * workspace's playbooks, newest first, labeled “<playbook> · v<no>”. Reading another
 * workspace's playbooks is structurally impossible: the matter carries its own workspace id.
 */
export async function playbookRevisionOptions(workspaceId: string): Promise<PlaybookOption[]> {
  const list = await playbookRepository.list(workspaceId)
  const out: PlaybookOption[] = []
  for (const p of list.items) {
    const detail = await playbookRepository.get(workspaceId, p.id)
    for (const r of [...detail.revisions].reverse()) {
      out.push({ revisionId: r.id, label: `${p.name} · v${r.no}`, no: r.no })
    }
  }
  return out
}
