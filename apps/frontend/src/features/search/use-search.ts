'use client'

import { useEffect, useRef, useState } from 'react'
import { McError } from '@/lib/mc/errors'
import { notifyPrivateUi, onPrivateUi, usePrivateScope } from '@/lib/mc/private-ui-events'
import { searchRecords } from './client'
import { searchInputSchema, type SearchGroupName, type SearchResponse } from './schemas'

type State = {
  key: string
  status: 'loading' | 'ready' | 'unavailable' | 'stale' | 'session-ended'
  groups: SearchResponse['groups']
  paging?: SearchGroupName
  pageError?: SearchGroupName
}
export function useSearch(
  query: string,
  epoch: string | undefined,
  matterId: string | undefined,
  composing: boolean,
) {
  const scope = usePrivateScope()
  const [retry, setRetry] = useState(0)
  const [endedEpoch, setEndedEpoch] = useState<string | undefined>()
  const key = JSON.stringify([epoch, matterId, query.trim(), composing, retry])
  const [state, setState] = useState<State | null>(null)
  const currentKey = useRef(key)
  useEffect(() => {
    currentKey.current = key
  }, [key])
  const sequence = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const valid =
    endedEpoch !== epoch &&
    !composing &&
    searchInputSchema.safeParse({ q: query, epoch, matterId }).success

  useEffect(() => {
    const invalidate = () => {
      sequence.current++
    }
    const token = ++sequence.current
    controller.current?.abort()
    if (!valid || !epoch) return
    const abort = new AbortController()
    controller.current = abort
    const timer = setTimeout(() => {
      void searchRecords({ q: query.trim(), epoch, matterId }, abort.signal)
        .then((result) => {
          if (token !== sequence.current || key !== currentKey.current) return
          setState({
            key,
            status: Object.values(result.groups).some((g) => g?.status === 'stale')
              ? 'stale'
              : 'ready',
            groups: Object.values(result.groups).some((g) => g?.status === 'stale')
              ? {}
              : result.groups,
          })
        })
        .catch((error) => {
          if (token !== sequence.current || key !== currentKey.current || abort.signal.aborted)
            return
          const status =
            error instanceof McError &&
            (error.status === 401 || error.code === 'ui-session-changed')
              ? 'session-ended'
              : error instanceof McError && error.code === 'search-stale'
                ? 'stale'
                : 'unavailable'
          if (status === 'session-ended' && scope)
            void notifyPrivateUi({ type: 'session-ended', scope })
          setState({ key, status, groups: {} })
        })
    }, 200)
    return () => {
      clearTimeout(timer)
      abort.abort()
      invalidate()
    }
  }, [query, epoch, matterId, key, valid, scope])

  useEffect(
    () =>
      onPrivateUi((event) => {
        if (!scope || event.scope.epoch !== scope.epoch || event.scope.runtime !== scope.runtime)
          return
        if (event.type === 'session-ended') setEndedEpoch(event.scope.epoch)
        sequence.current++
        controller.current?.abort()
        setState({
          key: currentKey.current,
          status: event.type === 'session-ended' ? 'session-ended' : 'stale',
          groups: {},
        })
      }),
    [scope],
  )

  const visible: State | null =
    endedEpoch === epoch && epoch
      ? { key, status: 'session-ended', groups: {} }
      : state?.key === key
        ? state
        : null
  async function more(group: SearchGroupName) {
    const previous = visible?.groups[group]
    if (!visible || !epoch || !previous?.hasMore || !previous.nextCursor || visible?.paging) return
    const token = sequence.current
    const abort = new AbortController()
    controller.current = abort
    setState({ ...visible, paging: group })
    try {
      const result = await searchRecords(
        {
          q: query.trim(),
          epoch,
          matterId,
          types: [group],
          cursors: { [group]: previous.nextCursor },
        },
        abort.signal,
      )
      if (key !== currentKey.current || token !== sequence.current) return
      const page = result.groups[group]
      if (!page || page.status === 'unavailable') {
        setState({ ...visible, status: 'ready', pageError: group, paging: undefined })
        return
      }
      if (page.status === 'stale') {
        setState({ key, status: 'stale', groups: {} })
        return
      }
      setState({
        key,
        status: 'ready',
        groups: {
          ...visible.groups,
          [group]: { ...page, items: [...previous.items, ...page.items] },
        },
      })
    } catch (error) {
      if (key !== currentKey.current || token !== sequence.current) return
      const status =
        error instanceof McError && (error.status === 401 || error.code === 'ui-session-changed')
          ? 'session-ended'
          : error instanceof McError && error.code === 'search-stale'
            ? 'stale'
            : 'unavailable'
      if (status === 'session-ended' && scope)
        void notifyPrivateUi({ type: 'session-ended', scope })
      if (status === 'unavailable')
        setState({ ...visible, status: 'ready', pageError: group, paging: undefined })
      else setState({ key, status, groups: {} })
    }
  }
  return {
    valid,
    state: visible,
    loading: valid && !visible,
    more,
    retry: () => {
      sequence.current++
      controller.current?.abort()
      setState(null)
      setRetry((n) => n + 1)
    },
  }
}
