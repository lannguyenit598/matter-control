'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { announceAction } from '@/components/organisms/action-announcer'
import { McError } from '@/lib/mc/errors'
import { notifyPrivateUi, onPrivateUi, usePrivateScope } from '@/lib/mc/private-ui-events'
import type { UiSession } from '@/lib/ui-session'
import { openCoordinator, type Coordinator } from './coordinator'
import { remaining, type FocusCommand, type FocusSlot } from './model'
import { readFocus, type FocusDescription } from './transport'

type State = {
  status: 'checking' | 'idle' | 'active' | 'suspended' | 'summary' | 'unsupported'
  slot: FocusSlot | null
  target: FocusDescription | null
  left: number
  busy: boolean
  cause?: 'clock' | 'ineligible' | 'unavailable'
}
type Handle = {
  view: State
  dispatch(command: FocusCommand): Promise<'accepted' | 'stale' | 'refused'>
}
const Context = createContext<Handle | null>(null)
const initial: State = { status: 'checking', slot: null, target: null, left: 0, busy: false }
export const useFocus = () => useContext(Context)

export function FocusProvider({
  identity,
  children,
}: {
  identity: UiSession | null
  children: ReactNode
}) {
  const [view, setView] = useState<State>(initial)
  const current = useRef(view)
  useEffect(() => {
    current.current = view
  }, [view])
  const coord = useRef<Coordinator | null>(null)
  const generation = useRef(0)
  const checked = useRef(0)
  const scope = usePrivateScope()
  const live = useRef(identity)
  const pathname = usePathname()
  const refresh = useRef<() => Promise<void>>(async () => {})
  const pending = useRef<AbortController | null>(null)
  const endedEpoch = useRef<string | null>(null)
  const publishing = useRef(false)

  const observeRefusal = useCallback(
    async (
      outcome: 'session-ended' | 'access-lost' | 'ineligible' | 'unavailable' | 'clock',
      expected: FocusSlot,
      id: UiSession,
      token: number,
    ) => {
      const coordinator = coord.current
      if (!coordinator || token !== generation.current || live.current?.epoch !== id.epoch) return
      const currentGeneration = ++generation.current
      pending.current?.abort()
      setView((v) => ({ ...v, target: null, status: 'checking', busy: false }))
      if (outcome === 'session-ended') endedEpoch.current = id.epoch
      if (outcome === 'session-ended' || outcome === 'access-lost') {
        const reason = outcome === 'session-ended' ? 'session-ended' : 'access-recheck'
        if (reason === 'session-ended') coordinator.invalidate(id.epoch)
        else coordinator.invalidate(id.epoch, reason)
        if (scope) {
          publishing.current = true
          void notifyPrivateUi({ type: reason, scope })
          publishing.current = false
        }
      }
      try {
        let captured = expected
        if (outcome === 'session-ended') {
          captured = await coordinator.read()
          if (captured.active && captured.active.epoch !== id.epoch) {
            if (currentGeneration === generation.current)
              setView({ ...initial, status: 'unsupported' })
            return
          }
        }
        const result =
          outcome === 'session-ended' || outcome === 'access-lost'
            ? await coordinator.reset(captured)
            : captured.active
              ? await coordinator.commit(captured, { type: 'suspend' }, id)
              : captured
        if (currentGeneration !== generation.current) return
        if (!result || result === 'stale') {
          await refresh.current()
          return
        }
        setView({
          ...initial,
          status:
            outcome === 'session-ended' ? 'unsupported' : result.active ? 'suspended' : 'idle',
          slot: result,
          left: result.active ? remaining(result.active, Date.now()) : 0,
          cause:
            outcome === 'clock'
              ? 'clock'
              : outcome === 'unavailable'
                ? 'unavailable'
                : 'ineligible',
        })
      } catch {
        if (currentGeneration === generation.current)
          setView((v) => ({ ...v, status: 'unsupported', target: null, busy: false }))
      }
    },
    [scope],
  )

  useEffect(() => {
    live.current = identity
    if (identity?.epoch !== endedEpoch.current) endedEpoch.current = null
    const invalidate = () => {
      generation.current++
    }
    let disposed = false
    let timer: ReturnType<typeof setInterval> | undefined
    const fail = () => {
      generation.current++
      pending.current?.abort()
      setView((v) => ({ ...v, status: 'unsupported', target: null, busy: false }))
    }
    const hide = () => {
      generation.current++
      pending.current?.abort()
      checked.current = 0
      setView((v) => ({ ...v, target: null, status: 'checking' }))
    }
    const sync = async () => {
      const id = live.current,
        coordinator = coord.current
      if (!id || !coordinator || disposed) return
      if (endedEpoch.current === id.epoch) {
        setView({ ...initial, status: 'unsupported' })
        return
      }
      const token = ++generation.current
      pending.current?.abort()
      const abort = new AbortController()
      pending.current = abort
      try {
        const slot = await coordinator.read()
        if (disposed || token !== generation.current) return
        const active = slot.active
        if (active && (active.principalKey !== id.principalKey || active.epoch !== id.epoch)) {
          await readFocus(id.epoch, undefined, undefined, abort.signal)
          if (disposed || token !== generation.current) return
          const cleared = await coordinator.reset(slot)
          if (!disposed)
            setView({
              ...initial,
              status: 'idle',
              slot: cleared && typeof cleared !== 'string' ? cleared : null,
            })
          return
        }
        if (!active) {
          setView({ ...initial, status: 'idle', slot })
          return
        }
        if (Date.now() < active.writtenAtWallMs) {
          await observeRefusal('clock', slot, id, token)
          return
        }
        setView((v) => ({
          ...v,
          slot,
          target: null,
          status: 'checking',
          left: remaining(active, Date.now()),
        }))
        if (remaining(active, Date.now()) === 0 || Date.parse(active.validUntil) <= Date.now()) {
          const cleared = await coordinator.reset(slot)
          if (token === generation.current && !disposed)
            setView({
              ...initial,
              status: 'summary',
              slot: cleared && typeof cleared !== 'string' ? cleared : null,
            })
          return
        }
        const reply = await readFocus(id.epoch, active, undefined, abort.signal)
        if (disposed || token !== generation.current || reply.identity.epoch !== id.epoch) return
        live.current = reply.identity
        checked.current = performance.now()
        if (reply.kind !== 'eligible') {
          await observeRefusal(
            reply.kind === 'access-lost'
              ? 'access-lost'
              : reply.kind === 'ineligible'
                ? 'ineligible'
                : 'unavailable',
            slot,
            reply.identity,
            token,
          )
          return
        }
        setView({
          status: active.state === 'SUSPENDED' ? 'suspended' : 'active',
          slot,
          target: reply.target,
          left: remaining(active, Date.now()),
          busy: false,
        })
      } catch (error) {
        if (disposed || token !== generation.current) return
        const slot = await coordinator.read()
        if (disposed || token !== generation.current) return
        if (
          error instanceof McError &&
          (error.status === 401 || error.code === 'ui-session-changed')
        ) {
          await observeRefusal('session-ended', slot, id, token)
        } else if (slot.active?.epoch === id.epoch) {
          await observeRefusal('unavailable', slot, id, token)
        } else setView({ ...initial, status: 'unsupported' })
      }
    }
    refresh.current = sync
    const off = onPrivateUi(async (event) => {
      if (publishing.current) return
      if (!scope || event.scope.epoch !== scope.epoch || event.scope.runtime !== scope.runtime)
        return
      hide()
      const coordinator = coord.current
      if (!coordinator) return
      if (event.type === 'access-recheck') {
        await sync()
        return
      }
      endedEpoch.current = scope.epoch
      if (!event.remote) coordinator.invalidate(scope.epoch)
      const slot = await coordinator.read()
      if (!slot.active || slot.active.epoch === scope.epoch) await coordinator.reset(slot)
      if (!disposed) setView({ ...initial, status: 'unsupported' })
    })
    const refocus = () => {
      if (document.visibilityState === 'hidden') hide()
      else {
        hide()
        void sync().catch(fail)
      }
    }
    document.addEventListener('visibilitychange', refocus)
    window.addEventListener('focus', refocus)
    if (identity)
      void openCoordinator(
        () => {
          hide()
          void sync().catch(fail)
        },
        (epoch, reason) => {
          if (epoch === identity.epoch) {
            hide()
            if (reason === 'session-ended') endedEpoch.current = epoch
            if (scope) void notifyPrivateUi({ type: reason, scope, remote: true })
            if (reason === 'session-ended') setView({ ...initial, status: 'unsupported' })
          }
        },
        fail,
      )
        .then(async (coordinator) => {
          if (disposed) {
            coordinator.close()
            return
          }
          coord.current = coordinator
          await sync()
          let lastWall = Date.now(),
            lastMono = performance.now(),
            nextRead = performance.now() + 20_000
          timer = setInterval(() => {
            const now = Date.now(),
              mono = performance.now(),
              active = current.current.slot?.active
            if (document.visibilityState !== 'hidden' && active) {
              const left = remaining(active, now)
              if (left === 0 || Date.parse(active.validUntil) <= now) {
                hide()
                void sync().catch(fail)
              } else if (
                Math.abs(now - lastWall - (mono - lastMono)) > 5000 ||
                (checked.current > 0 && mono - checked.current >= 30_000)
              ) {
                hide()
                void coordinator
                  .commit(current.current.slot!, { type: 'suspend' }, live.current!)
                  .then(() => sync())
                  .catch(fail)
              } else {
                setView((v) => (v.left === left ? v : { ...v, left }))
                if (mono >= nextRead) {
                  nextRead = mono + 20_000
                  void sync().catch(fail)
                }
              }
            }
            lastWall = now
            lastMono = mono
          }, 1000)
        })
        .catch(fail)

    return () => {
      disposed = true
      invalidate()
      pending.current?.abort()
      clearInterval(timer)
      off()
      document.removeEventListener('visibilitychange', refocus)
      window.removeEventListener('focus', refocus)
      coord.current?.close()
      coord.current = null
    }
  }, [identity, scope, observeRefusal])

  useEffect(() => {
    void refresh.current()
  }, [pathname])

  async function dispatch(command: FocusCommand): Promise<'accepted' | 'stale' | 'refused'> {
    const coordinator = coord.current,
      id = live.current,
      expected = view.slot
    if (
      !coordinator ||
      !id ||
      !expected ||
      endedEpoch.current === id.epoch ||
      view.busy ||
      view.status === 'unsupported'
    )
      return 'refused'
    const token = generation.current
    setView((v) => ({ ...v, busy: true }))
    try {
      let eligible = false
      if (command.type === 'start' || command.type === 'resume') {
        const target = command.type === 'start' ? command.target : expected.active
        if (!target) return 'refused'
        const reply = await readFocus(id.epoch, target)
        if (token !== generation.current || reply.identity.epoch !== id.epoch) return 'refused'
        if (reply.kind !== 'eligible') {
          await observeRefusal(
            reply.kind === 'access-lost'
              ? 'access-lost'
              : reply.kind === 'ineligible'
                ? 'ineligible'
                : 'unavailable',
            expected,
            reply.identity,
            token,
          )
          announceAction({
            en: 'Focus was not started or resumed. Check the current Action before trying again.',
            vi: 'Chưa bắt đầu hoặc tiếp tục tập trung. Kiểm tra hành động hiện tại trước khi thử lại.',
          })
          return 'refused'
        }
        eligible = true
        live.current = reply.identity
      }
      if (token !== generation.current) return 'refused'
      const result = await coordinator.commit(expected, command, live.current!, eligible)
      if (result === 'stale' || result === null) {
        await refresh.current()
        announceAction({
          en: 'Focus changed in another tab. Your change was not applied.',
          vi: 'Tập trung đã thay đổi ở tab khác. Thao tác của bạn chưa được áp dụng.',
        })
        return result === 'stale' ? 'stale' : 'refused'
      }
      if (command.type === 'end') setView({ ...initial, status: 'summary', slot: result })
      else await refresh.current()
      announceAction({
        en: 'Focus updated. Work status is unchanged.',
        vi: 'Đã cập nhật tập trung. Trạng thái công việc không đổi.',
      })
      return 'accepted'
    } catch (error) {
      if (token === generation.current)
        await observeRefusal(
          error instanceof McError && (error.status === 401 || error.code === 'ui-session-changed')
            ? 'session-ended'
            : 'unavailable',
          expected,
          id,
          token,
        )
      return 'refused'
    } finally {
      setView((v) => ({ ...v, busy: false }))
    }
  }
  return (
    <Context.Provider
      value={{ view: identity ? view : { ...initial, status: 'unsupported' }, dispatch }}
    >
      {children}
    </Context.Provider>
  )
}
