import { useCallback, useEffect, useRef, useState } from 'react'

export function useHistoryPages<T>(fetchPage: (cursor?: string) => Promise<{items: T[]; next: string | null}>) {
  const [items, setItems] = useState<T[]>([])
  const [next, setNext] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const older = useRef(false)
  const requested = useRef<string | undefined>(undefined)
  const generation = useRef(0)
  const pending = useRef(false)
  const load = useCallback(async (cursor?: string, quiet = false) => {
    if (quiet && pending.current) return
    pending.current = true
    requested.current = cursor
    older.current = !!cursor
    const token = ++generation.current
    if (!quiet) { setLoading(true); setFailed(false) }
    try {
      const page = await fetchPage(cursor)
      if (token !== generation.current) return
      setItems(prior => cursor ? [...prior, ...page.items] : page.items)
      setNext(page.next)
      setFailed(false)
    } catch { if (token === generation.current && !quiet) setFailed(true) }
    finally {
      if (token === generation.current) {
        pending.current = false
        setLoading(false)
      }
    }
  }, [fetchPage])
  useEffect(() => {
    setItems([]); setNext(null); void load()
    return () => { generation.current++ }
  }, [load])
  return { items, next, loading, failed, load, older, retry: () => load(requested.current) }
}
