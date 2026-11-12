import { describe, expect, it } from 'vitest'

import { mailPageSchema } from './schemas'

describe('review: API mail contract', () => {
  it('accepts a captured message without a Date header', () => {
    const result = mailPageSchema.safeParse({
      items: [{
        id: '01900000-0000-7000-8000-000000000001',
        documentId: '01900000-0000-7000-8000-000000000002',
        versionId: '01900000-0000-7000-8000-000000000003',
        direction: 'INBOUND', sender: 'synthetic@example.invalid', recipients: [],
        subject: 'Synthetic mail without Date', excerpt: 'Body', sentAt: null,
        createdAt: '2026-11-12T00:00:00Z',
      }],
      page: { limit: 1, maxLimit: 200, total: 1 },
    })
    expect(result.success, JSON.stringify(result)).toBe(true)
  })
})
