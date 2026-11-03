import type { UiSession } from '@/lib/ui-session'
import { emptySlot, slotSchema, transition, type FocusCommand, type FocusSlot } from './model'

export function compareFocus(
  current: FocusSlot,
  expected: FocusSlot,
  command: FocusCommand,
  identity: UiSession,
  now: number,
  nonce: string,
  eligible: boolean,
) {
  if (current.generation !== expected.generation || current.revision !== expected.revision)
    return 'stale' as const
  return transition(current, command, identity, now, nonce, eligible)
}

export type Coordinator = Awaited<ReturnType<typeof openCoordinator>>

/** Overlapping IDB readwrite transactions serialize the singleton; the channel is notification only. */
export async function openCoordinator(
  onChange: () => void,
  onInvalidate: (epoch: string, reason: 'session-ended' | 'access-recheck') => void,
  onFailure: () => void,
) {
  if (!globalThis.indexedDB || !globalThis.BroadcastChannel)
    throw new Error('coordination unavailable')
  const channel = new BroadcastChannel('mc-focus-v1')
  let closed = false
  let db: IDBDatabase
  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mc-focus-v1', 1)
      let settled = false
      const timer = setTimeout(() => {
        settled = true
        reject(new Error('storage blocked'))
      }, 1500)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('current'))
          request.result.createObjectStore('current')
      }
      request.onsuccess = () => {
        clearTimeout(timer)
        if (settled) request.result.close()
        else {
          settled = true
          resolve(request.result)
        }
      }
      request.onerror = () => {
        clearTimeout(timer)
        settled = true
        reject(new Error('storage unavailable'))
      }
      request.onblocked = () => {
        clearTimeout(timer)
        settled = true
        reject(new Error('storage blocked'))
      }
    })
  } catch (error) {
    channel.close()
    throw error
  }
  db.onversionchange = () => {
    closed = true
    db.close()
    channel.close()
    onFailure()
  }
  channel.onmessageerror = onFailure
  channel.onmessage = ({ data }: MessageEvent<unknown>) => {
    if (
      !data ||
      typeof data !== 'object' ||
      !('version' in data) ||
      data.version !== 1 ||
      !('type' in data)
    )
      return
    if (data.type === 'invalidate' && 'epoch' in data && typeof data.epoch === 'string')
      onInvalidate(
        data.epoch,
        'reason' in data && data.reason === 'access-recheck' ? 'access-recheck' : 'session-ended',
      )
    else if (data.type === 'committed') onChange()
  }
  const transaction = (write: boolean, update?: (slot: FocusSlot) => FocusSlot | 'stale' | null) =>
    new Promise<FocusSlot | 'stale' | null>((resolve, reject) => {
      if (closed) {
        reject(new Error('coordination closed'))
        return
      }
      const tx = db.transaction('current', write ? 'readwrite' : 'readonly')
      const store = tx.objectStore('current')
      let result: FocusSlot | 'stale' | null = null
      let wrote = false
      let failure: Error | undefined
      const get = store.get('slot')
      get.onsuccess = () => {
        const parsed =
          get.result === undefined
            ? { success: true as const, data: emptySlot(crypto.randomUUID()) }
            : slotSchema.safeParse(get.result)
        if (!parsed.success) {
          failure = new Error('unsupported stored Focus')
          tx.abort()
          return
        }
        result = update ? update(parsed.data) : parsed.data
        if (
          write &&
          result &&
          typeof result !== 'string' &&
          (get.result === undefined || result !== parsed.data)
        ) {
          store.put(result, 'slot')
          wrote = true
        }
      }
      tx.onabort = () => reject(failure ?? new Error('storage commit failed'))
      tx.onerror = () => {
        failure = new Error('storage transaction failed')
      }
      tx.oncomplete = () => {
        if (wrote && result && typeof result !== 'string') {
          try {
            channel.postMessage({
              version: 1,
              type: 'committed',
              generation: result.generation,
              revision: result.revision,
            })
          } catch {
            onFailure()
            reject(new Error('notification failed after commit'))
            return
          }
        }
        resolve(result)
      }
    })
  return {
    read: () => transaction(true, (slot) => slot) as Promise<FocusSlot>,
    commit: (expected: FocusSlot, command: FocusCommand, identity: UiSession, eligible = false) =>
      transaction(true, (current) =>
        compareFocus(
          current,
          expected,
          command,
          identity,
          Date.now(),
          crypto.randomUUID(),
          eligible,
        ),
      ),
    reset: (expected: FocusSlot) =>
      transaction(true, (current) =>
        current.generation !== expected.generation || current.revision !== expected.revision
          ? 'stale'
          : current.revision >= Number.MAX_SAFE_INTEGER
            ? null
            : {
                schema: 1,
                generation: crypto.randomUUID(),
                revision: current.revision + 1,
                active: null,
              },
      ),
    invalidate: (epoch: string, reason: 'session-ended' | 'access-recheck' = 'session-ended') => {
      try {
        channel.postMessage({ version: 1, type: 'invalidate', epoch, reason })
      } catch {
        onFailure()
      }
    },
    close: () => {
      closed = true
      db.close()
      channel.close()
    },
  }
}
