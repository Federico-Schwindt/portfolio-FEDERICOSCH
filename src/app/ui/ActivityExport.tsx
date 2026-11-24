import { useEffect, useRef, useState } from 'react'
import { csvLine, downloadCsv } from '../csv'
import { useStore } from '../store'
import type { ActivityWho, Status } from '../types'

export function ActivityExport({ who, query, viewer, disabled }: {
  who: ActivityWho; query: string; viewer: string; disabled: boolean
}) {
  const { be, t } = useStore()
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  const download = async () => {
    if (pending.current) {
      pending.current.abort()
      return
    }
    const controller = new AbortController()
    const { signal } = controller
    pending.current = controller
    setMessage('')
    setProgress(0)
    try {
      const lines = [csvLine([t.pl.date, t.csv.number, t.form.title, t.csv.author, t.csv.event, t.csv.message])]
      let cursor: string | undefined
      do {
        const page = await be.activity(who, cursor, query, { viewer, signal })
        if (signal.aborted) return
        for (const e of page.items) {
          const author = e.who === 'client' ? e.by || t.admin.client : t.who[e.who]
          const body = e.kind === 'status' ? t.evStatus[e.body as Status] ?? e.body : e.body
          lines.push(csvLine([e.at, String(e.requestNumber), e.requestTitle, author, t.csv.events[e.kind], body]))
        }
        cursor = page.next ?? undefined
        setProgress(lines.length - 1)
      } while (cursor)
      if (lines.length > 1) downloadCsv(t.csv.activityFile + '.csv', lines)
      setMessage(lines.length > 1 ? t.csv.downloaded(lines.length - 1) : t.csv.empty)
    } catch {
      if (!signal.aborted) setMessage(t.csv.error)
    } finally {
      pending.current = null
      setProgress(null)
    }
  }
  return <>
    <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={progress === null && disabled} onClick={download}>
      {progress === null ? t.csv.activity : t.csv.cancel}
    </button>
    <span role="status">{progress !== null ? t.csv.preparing(progress) : message}</span>
  </>
}
