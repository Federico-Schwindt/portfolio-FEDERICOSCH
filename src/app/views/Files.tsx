import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import type { FileItem } from '../types'
import { Dropzone, FileTile, Preview } from '../ui/files'
import { isImage } from '../ui/bits'

type Filter = 'all' | 'images' | 'docs' | 'deliv' | 'brief' | 'brand'

/** the library: every file sent and delivered, filterable, searchable, previewable */
export function Files() {
  const { t, files, reqs, go } = useStore()
  const [f, setF] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<FileItem | null>(null)
  const title = (id: string | null) => reqs.find((r) => r.id === id)?.title
  const list = useMemo(() => files.filter((x) => {
    if (f === 'images' && !isImage(x.mime)) return false
    if (f === 'docs' && isImage(x.mime)) return false
    if (f === 'deliv' && x.kind !== 'deliverable') return false
    if (f === 'brief' && !(x.kind === 'brief' || x.kind === 'asset')) return false
    if (f === 'brand' && x.kind !== 'brand') return false
    const s = q.trim().toLowerCase()
    return !s || x.name.toLowerCase().includes(s) || (title(x.requestId) ?? '').toLowerCase().includes(s)
  }), [files, f, q, reqs])
  const tabs: [Filter, string][] = [['all', t.x.files.all], ['deliv', t.x.files.deliv], ['brief', t.x.files.brief], ['images', t.x.files.images], ['docs', t.x.files.docs], ['brand', t.x.files.brand]]
  return (
    <div className="fl">
      <header className="ap-head"><div><p className="mono ap-kicker">{files.length} · {t.studio}</p><h1 className="d">{t.x.files.title}</h1><p className="ap-lead">{t.x.files.sub}</p></div></header>
      <Dropzone kind="asset" />
      <div className="tb">
        <label className="tb__q"><Icon name="magnifyingGlass" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.x.files.search} /></label>
        <div className="tb__chips">{tabs.map(([k, l]) => <button key={k} type="button" className={f === k ? 'is-on' : ''} onClick={() => setF(k)}>{l}<i>{k === 'all' ? files.length : files.filter((x) => (k === 'images' ? isImage(x.mime) : k === 'docs' ? !isImage(x.mime) : k === 'deliv' ? x.kind === 'deliverable' : k === 'brief' ? x.kind === 'brief' || x.kind === 'asset' : x.kind === 'brand')).length}</i></button>)}</div>
      </div>
      {list.length ? (
        <div className="fl__grid">
          {list.map((x, i) => (
            <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}>
              <FileTile f={x} onOpen={setOpen} />
              {x.requestId && <button type="button" className="fl__req mono" onClick={() => go(`board/${x.requestId}`)}>{t.x.files.of} {title(x.requestId)}</button>}
            </motion.div>
          ))}
        </div>
      ) : <p className="muted fl__none">{t.x.files.none}</p>}
      <Preview f={open} onClose={() => setOpen(null)} />
    </div>
  )
}
