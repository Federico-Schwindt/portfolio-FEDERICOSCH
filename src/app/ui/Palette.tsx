import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon, type IconName } from '../Icon'
import { operationsText } from '../i18n-studio-operations'
import { studioText } from '../i18n-studio'
import { fold, maxQueryLength, searchLimit, type SearchMatches } from '../workspace-search'
import type { FileItem } from '../types'
import { Preview } from './files'

type Item = { key: string; label: string; detail?: string; icon: IconName; open: () => void }
type Page = [string, string, IconName]
type ResponseState = { query: string; offset: number; matches?: SearchMatches; failed?: boolean }

export function Palette() {
  const { palette, user } = useStore()
  return palette && user && <WorkspaceSearch key={user.id + user.role + (user.account ?? '')} />
}

function WorkspaceSearch() {
  const { be, t, lang, user, reqs, go, setPalette, setNewOpen } = useStore()
  const studio = user?.role === 'admin', s = t.search
  const [text, setText] = useState('')
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState<ResponseState | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const offset = page * searchLimit
  const [preview, setPreview] = useState<FileItem | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const query = fold(text.trim())
  const account = user?.account ?? user?.id
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    return () => el.close()
  }, [])
  // Closing the file dialog releases its focus trap during React's cleanup.
  useEffect(() => { if (!preview) input.current?.focus() }, [preview])
  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const matches = await be.search(query, offset, controller.signal)
        if (!controller.signal.aborted) setResult({ query, offset, matches })
      } catch {
        if (!controller.signal.aborted) setResult({ query, offset, failed: true })
      }
    }, 160)
    return () => { clearTimeout(timer); controller.abort() }
  }, [be, query, offset, attempt])

  const requests = useMemo(() => {
    const hits = reqs.map(r => {
      if (!studio && r.owner !== account) return null
      const number = String(r.number), title = fold(r.title), brief = fold(r.brief || '')
      let rank = 0
      if (query && query !== number && query !== '#' + number && title !== query) {
        if (title.startsWith(query)) rank = 1
        else if (('#' + number + ' ' + title).includes(query)) rank = 2
        else if (brief.includes(query)) rank = 3
        else return null
      }
      const detail = [studio && r.ownerName, t.status[r.status]]
      if (rank === 3) {
        const start = Math.max(0, brief.indexOf(query) - 20)
        detail.push(s.brief + ' · ' + (start ? '…' : '') + r.brief.slice(start, start + 100))
      }
      return { r, rank, detail: detail.filter(Boolean).join(' · ') }
    }).filter(hit => hit !== null)
    return hits.sort((a, b) => a.rank - b.rank || b.r.createdAt.localeCompare(a.r.createdAt) || b.r.number - a.r.number)
  }, [reqs, studio, account, query, t, s])

  const close = () => { dialog.current?.close(); setPalette(false) }
  const jump = (route: string) => { close(); go(route) }
  const pages: Page[] = [
    ['overview', t.nav.overview, 'house'], ['board', t.nav.board, 'kanban'],
    ['calendar', t.sec.calendar, 'calendar'], ['deliveries', t.sec.deliveries, 'package'],
    ['files', t.x.nav.files, 'file'], ['activity', t.sec.activity, 'pulse'],
    ['reports', t.x.nav.reports, 'chartBar'],
    ['brand', t.nav.brand, 'palette'], ['profile', t.sec.profile, 'userGear'],
  ]
  if (studio) {
    const ops = operationsText[lang], labels = studioText[lang]
    pages.push(['admin', t.nav.admin, 'kanban'], ['admin/business', labels.business, 'chartBar'],
      ['admin/clients', t.adm.tabs[1], 'users'], ['admin/changes', labels.changes, 'clock'],
      ['admin/finance', ops.finance, 'creditCard'], ['admin/feedback', ops.feedback, 'star'],
      ['admin/workload', ops.workload, 'calendar'], ['admin/payments', t.adm.tabs[2], 'creditCard'])
  } else pages.push(['team', t.x.team.nav, 'users'])
  const actions: Item[] = [
    { key: 'new', label: t.newReq, icon: 'plus', open: () => { close(); setNewOpen(true) } },
    ...pages.map(([key, label, icon]) => ({ key, label, icon, open: () => jump(key) })),
  ]
  const response = query && result?.query === query && result.offset === offset ? result : null
  const matches = response?.matches
  const groups: [string, Item[]][] = [
    [s.requests, requests.slice(offset, query ? offset + searchLimit : 3).map(({ r, detail }) => ({
      key: 'req-' + r.id, label: '#' + r.number + ' ' + r.title, detail, icon: 'kanban',
      open: () => jump((studio ? 'admin/' : 'board/') + r.id),
    }))],
    [s.files, (matches?.files ?? []).slice(0, searchLimit).map(({ file, requestTitle, ownerName }) => ({
      key: 'file-' + file.id, label: file.name, icon: 'paperclip', open: () => setPreview(file),
      detail: [file.kind === 'deliverable' && 'v' + file.version, requestTitle, studio && ownerName].filter(Boolean).join(' · '),
    }))],
    [s.clients, (matches?.clients ?? []).slice(0, searchLimit).map(c => ({
      key: 'client-' + c.id, label: c.label, detail: c.email, icon: 'users', open: () => jump('admin/clients/' + c.id),
    }))],
    [s.pages, page ? [] : actions.filter(a => !query || fold(a.label).includes(query))],
  ]
  const items = groups.flatMap(([, rows]) => rows)
  const current = items.find(it => it.key === selected) ?? items[0]
  const more = !!query && (requests.length > offset + searchLimit || (matches?.files.length ?? 0) > searchLimit || (matches?.clients.length ?? 0) > searchLimit)
  const showPage = (next: number) => {
    setPage(next); setSelected('')
    list.current?.scrollTo(0, 0); input.current?.focus()
  }
  const choose = (delta: number) => {
    if (!items.length) return
    const next = items[(items.indexOf(current) + delta + items.length) % items.length]
    setSelected(next.key)
    document.getElementById('pl-' + next.key)?.scrollIntoView({ block: 'nearest' })
  }
  return <>
    <dialog ref={dialog} className="pl" aria-label={s.title}
      onCancel={e => { e.preventDefault(); close() }}
      onClick={e => { if (e.target === e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect()
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close()
      } }}
      onKeyDown={e => {
        e.stopPropagation()
        if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); close() }
      }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="pl__in"><Icon name="magnifyingGlass" size={18} />
          <input ref={input} role="combobox" aria-label={s.title} aria-expanded="true" aria-controls="pl-results"
            aria-autocomplete="list" aria-activedescendant={current ? 'pl-' + current.key : undefined}
            value={text} maxLength={maxQueryLength} placeholder={studio ? s.studioPlaceholder : s.placeholder}
            onChange={e => { setText(e.target.value); showPage(0) }}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); choose(e.key === 'ArrowDown' ? 1 : -1) }
              if (e.key === 'Enter') { e.preventDefault(); current?.open() }
            }} />
          <button type="button" className="dr__x" aria-label={s.close} onClick={close}><Icon name="x" size={16} /></button>
        </div>
        <ul ref={list} className="pl__list" id="pl-results" role="listbox" aria-label={s.title}>
          {groups.filter(([, rows]) => rows.length).map(([label, rows]) => <li key={label} role="presentation">
            <p className="pl__group" aria-hidden="true">{label}</p>
            <ul role="group" aria-label={label}>{rows.map(it => <li key={it.key} id={'pl-' + it.key}
              role="option" aria-selected={it === current} className="pl__option"
              onMouseDown={e => e.preventDefault()} onMouseMove={() => setSelected(it.key)} onClick={it.open}>
              <Icon name={it.icon} size={16} /><span>{it.label}{it.detail && <small>{it.detail}</small>}</span>
            </li>)}</ul>
          </li>)}
        </ul>
        <div role="status" className="pl__status">{response?.failed
          ? <>{s.error} <button className="bl-link" onClick={() => { setResult(null); setAttempt(n => n + 1); input.current?.focus() }}>{t.priorities.retry}</button></>
          : query && !response ? s.loading : !items.length ? s.empty : null}</div>
        {(more || page > 0) && <div className="pl__pages">
          <button className="ap-btn ap-btn--sm ap-btn--ghost" disabled={!page} onClick={() => showPage(page - 1)}>{s.previous}</button>
          <span aria-live="polite">{s.page(page + 1)}</span>
          <button className="ap-btn ap-btn--sm ap-btn--ghost" disabled={!more} onClick={() => showPage(page + 1)}>{s.next}</button>
        </div>}
      </motion.div>
    </dialog>
    <Preview f={preview} onClose={() => setPreview(null)} />
  </>
}
