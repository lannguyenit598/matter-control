import { expect, it } from 'vitest'

import { mailPageSchema } from './schemas'

it('accepts mixed dated and undated captured mail', () => {
  const row = {
    id: 'mail1',
    documentId: 'doc1',
    versionId: 'version1',
    direction: 'INBOUND',
    sender: 'synthetic@example.invalid',
    recipients: [],
    subject: 'Synthetic mail',
    excerpt: '',
    createdAt: '2026-11-12T00:00:00Z',
  }
  const parsed = mailPageSchema.safeParse({
    items: [
      { ...row, sentAt: null },
      { ...row, id: 'mail2', sentAt: '2026-11-11T00:00:00Z' },
    ],
    page: { limit: 2, maxLimit: 200, total: 2 },
  })
  expect(parsed.success).toBe(true)
})
