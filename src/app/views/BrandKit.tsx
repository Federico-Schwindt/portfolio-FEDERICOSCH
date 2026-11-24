import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { Dropzone, FileTile } from '../ui/files'

export function BrandKit() {
  const { t, user, be, toast, reload, files } = useStore()
  const brandFiles = files.filter((f) => f.kind === 'brand')
  const [colors, setColors] = useState<string[]>(user?.brand.colors ?? ['#F01111', '#0B0B0B', '#FFF1E0'])
  const [fonts, setFonts] = useState(user?.brand.fonts ?? '')
  const [site, setSite] = useState(user?.brand.site ?? '')
  const [notes, setNotes] = useState(user?.brand.notes ?? '')
  const [name, setName] = useState(user?.name ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  useEffect(() => { if (user) { setName(user.name); setCompany(user.company) } }, [user])
  const save = async () => { await be.updateProfile({ name, company, brand: { colors, fonts, site, notes } }); await reload(); toast(t.brandKit.saved) }
  return (
    <div className="bk">
      <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{t.brandKit.title}</h1><p className="ap-lead">{t.brandKit.sub}</p></div><button className="ap-btn ap-btn--red" type="button" onClick={save}><Icon name="check" size={15} />{t.brandKit.save}</button></header>
      <div className="bk__grid">
        <section className="card">
          <p className="mono">{t.brandKit.colors}</p>
          <div className="bk__sw">
            {colors.map((c, i) => (
              <label key={i} className="bk__c" style={{ background: c }}>
                <input type="color" value={c} onChange={(e) => setColors(colors.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`${t.brandKit.colors} ${i + 1}`} />
                <span className="mono">{c.toUpperCase()}</span>
              </label>
            ))}
            <button type="button" className="bk__add" onClick={() => setColors([...colors, '#888888'])} aria-label="Add colour"><Icon name="plus" size={18} /></button>
          </div>
          <div className="bk__prev" style={{ background: colors[2] ?? '#fff', color: colors[1] ?? '#000' }}>
            <b style={{ fontFamily: fonts.split(',')[0] }}>{company || 'Your brand'}</b>
            <span style={{ background: colors[0], color: colors[2] ?? '#fff' }}>Call to action</span>
          </div>
        </section>
        <section className="card bk__logo">
          <p className="mono">{t.x.onb.logo}</p>
          {brandFiles.length > 0 && <div className="dr__files2">{brandFiles.map((f) => <FileTile key={f.id} f={f} />)}</div>}
          <Dropzone kind="brand" compact>{t.x.files.drop}</Dropzone>
        </section>
        <section className="card bk__fields">
          <label><span className="mono">{t.login.name}</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label><span className="mono">Company</span><input value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label><span className="mono">{t.brandKit.fonts}</span><input value={fonts} onChange={(e) => setFonts(e.target.value)} placeholder="Archivo, Inter…" /></label>
          <label><span className="mono">{t.brandKit.site}</span><input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://" inputMode="url" /></label>
          <label><span className="mono">{t.brandKit.notes}</span><textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        </section>
      </div>
    </div>
  )
}
