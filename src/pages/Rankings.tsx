import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  subscribeToCategories, subscribeToFighters, createCategory, renameCategory, deleteCategory,
  createFighter, createFighterReturningId, saveBout, deleteBout, updateFighter, deleteFighter, getRecord, getScore, setChampion, fileToThumbnail, type FighterInput,
} from '../lib/fighters'
import { FIGHT_METHODS } from '../lib/types'
import type { Fighter, WeightCategory, Fight, FightResult } from '../lib/types'
import './Rankings.css'

const RESULT_LABEL: Record<FightResult, string> = { win: 'Victory', loss: 'Defeat', draw: 'Draw' }

export function Crown({ size = 18 }: { size?: number }) {
  return (
    <svg className="rk-crown" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="Champion">
      <path d="M2 7l5 4 5-7 5 7 5-4-2 12H4L2 7zm2.6 14h14.8v2H4.6v-2z" />
    </svg>
  )
}

export const emptyFighter = (categoryIds: string[]): FighterInput => ({
  categoryIds, firstName: '', lastName: '', nickname: '', age: '', height: '', reach: '',
  weight: '', stance: '', nationality: '', team: '', photo: '', notes: '', fights: [],
})

export function fullName(f: Fighter) { return `${f.firstName} ${f.lastName}`.trim() }

export function Avatar({ f, size = 56 }: { f: Fighter | FighterInput; size?: number }) {
  return (
    <div className="fighter-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {f.photo
        ? <img src={f.photo} alt="" />
        : `${f.firstName.charAt(0)}${f.lastName.charAt(0)}`.toUpperCase() || '?'}
    </div>
  )
}

export function RecordBadge({ fights }: { fights: Fight[] }) {
  const r = getRecord(fights)
  return (
    <span className="record-badge">
      <b className="rec-w">{r.wins}</b>-<b className="rec-l">{r.losses}</b>-<b className="rec-d">{r.draws}</b>
    </span>
  )
}

/* ───────────── Fighter form (create / edit) ───────────── */
export function FighterForm({ initial, categories, onSave, onClose, title }: {
  initial: FighterInput
  categories: WeightCategory[]
  title: string
  onSave: (d: FighterInput) => Promise<void>
  onClose: () => void
}) {
  const [d, setD] = useState<FighterInput>(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof FighterInput, v: string) => setD((p) => ({ ...p, [k]: v }))
  const toggleCat = (id: string) => setD((p) => ({
    ...p,
    categoryIds: p.categoryIds.includes(id) ? p.categoryIds.filter((c) => c !== id) : [...p.categoryIds, id],
  }))

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try { set('photo', await fileToThumbnail(file)) } catch { setErr('Could not read that image.') }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!d.firstName.trim() || !d.lastName.trim()) { setErr('First name and last name are required.'); return }
    setSaving(true)
    try {
      await onSave({ ...d, firstName: d.firstName.trim(), lastName: d.lastName.trim() })
      onClose()
    } catch { setErr('Failed to save fighter.'); setSaving(false) }
  }

  const field = (label: string, k: keyof FighterInput, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" value={d[k] as string} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  )

  return (
    <div className="modal-overlay rk-overlay-top" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-container rk-modal animate-scaleIn" onSubmit={submit}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body rk-form">
          <div className="rk-photo-row">
            <Avatar f={d} size={84} />
            <div className="rk-photo-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                {d.photo ? 'Change photo' : 'Upload photo'}
              </button>
              {d.photo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('photo', '')}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
            </div>
          </div>
          <div className="rk-grid">
            {field('First name *', 'firstName', { required: true })}
            {field('Last name *', 'lastName', { required: true })}
            {field('Nickname', 'nickname', { placeholder: 'e.g. The Hammer' })}
            {field('Age', 'age', { type: 'number', min: 0 })}
            {field('Height', 'height', { placeholder: `6'0"` })}
            {field('Reach (in)', 'reach', { type: 'number', min: 0, step: '0.5' })}
            {field('Weight (lbs)', 'weight', { type: 'number', min: 0, step: '0.1', placeholder: '175' })}
            <div className="form-group">
              <label className="form-label">Stance</label>
              <select className="form-select" value={d.stance} onChange={(e) => set('stance', e.target.value)}>
                <option value="">—</option>
                <option>Orthodox</option><option>Southpaw</option><option>Switch</option>
              </select>
            </div>
            {field('Nationality', 'nationality')}
            {field('Team / Gym', 'team')}
          </div>
          <div className="form-group">
            <label className="form-label">Categories</label>
            {categories.length === 0 ? (
              <p className="rk-empty">No categories created yet.</p>
            ) : (
              <div className="rk-check-grid">
                {categories.map((c) => (
                  <label key={c.id} className={`rk-check ${d.categoryIds.includes(c.id) ? 'active' : ''}`}>
                    <input type="checkbox" checked={d.categoryIds.includes(c.id)} onChange={() => toggleCat(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {err && <div className="login-error">{err}</div>}
          <div className="rk-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ───────────── Opponent picker (search existing / create new) ───────────── */
export function OpponentPicker({ candidates, text, selectedId, categoryId, onChange }: {
  candidates: Fighter[]; text: string; selectedId: string; categoryId: string
  onChange: (text: string, id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [hint, setHint] = useState('')
  const q = text.trim().toLowerCase()
  const results = q
    ? candidates.filter((f) => `${fullName(f)} ${f.nickname}`.toLowerCase().includes(q)).slice(0, 6)
    : []
  const exact = candidates.some((f) => fullName(f).toLowerCase() === q)

  async function createNew() {
    const parts = text.trim().split(/\s+/)
    if (parts.length < 2) { setHint('Type first name and last name to create a new fighter.'); return }
    setCreating(true)
    try {
      const id = await createFighterReturningId({
        ...emptyFighter(categoryId ? [categoryId] : []),
        firstName: parts[0], lastName: parts.slice(1).join(' '),
      })
      onChange(text.trim(), id)
      setOpen(false); setHint('')
    } catch { setHint('Could not create the fighter.') } finally { setCreating(false) }
  }

  return (
    <div className="rk-picker">
      <input className={`form-input ${selectedId ? 'rk-picker-ok' : ''}`} required value={text}
        placeholder="Search or type a name…"
        onChange={(e) => { onChange(e.target.value, ''); setOpen(true); setHint('') }}
        onFocus={() => setOpen(true)} />
      {selectedId && <span className="rk-picker-tick">✓ linked</span>}
      {open && !selectedId && q && (
        <div className="rk-picker-list">
          {results.map((f) => (
            <div key={f.id} className="rk-picker-item"
              onMouseDown={(e) => { e.preventDefault(); onChange(fullName(f), f.id); setOpen(false) }}>
              <Avatar f={f} size={26} />
              <span>{fullName(f)}{f.nickname && <em> “{f.nickname}”</em>}</span>
              <RecordBadge fights={f.fights} />
            </div>
          ))}
          {!exact && (
            <div className="rk-picker-item rk-picker-create" onMouseDown={(e) => { e.preventDefault(); if (!creating) createNew() }}>
              {creating ? 'Creating…' : `+ Create “${text.trim()}” as new fighter`}
            </div>
          )}
          {hint && <div className="rk-picker-hint">{hint}</div>}
        </div>
      )}
    </div>
  )
}

/* ───────────── Fighter profile ───────────── */
export function FighterProfile({ fighter, fighters, categories, onToggleChamp, onClose, onEdit }: {
  fighter: Fighter; fighters: Fighter[]; categories: WeightCategory[]; onToggleChamp: (categoryId: string) => void; onClose: () => void; onEdit: () => void
}) {
  const enrolled = categories.filter((c) => fighter.categoryIds.includes(c.id))
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Other'
  const isChamp = enrolled.some((c) => c.championId === fighter.id)
  const blank = { opponent: '', opponentId: '', result: 'win' as FightResult, categoryId: enrolled[0]?.id ?? '', method: 'Decision (Unanimous)', date: '', event: '', round: '', notes: '' }
  const [form, setForm] = useState(blank)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [legacyName, setLegacyName] = useState('')
  const [fightErr, setFightErr] = useState('')
  const [savingFight, setSavingFight] = useState(false)
  const rec = getRecord(fighter.fights)

  const sorted = useMemo(
    () => [...fighter.fights].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [fighter.fights]
  )

  const oppName = (f: Fight) => fighters.find((x) => x.id === f.opponentId) ? fullName(fighters.find((x) => x.id === f.opponentId)!) : f.opponent

  async function saveFight(e: React.FormEvent) {
    e.preventDefault()
    setFightErr('')
    const legacyKept = !!editingId && !form.opponentId && form.opponent === legacyName
    if (!form.opponentId && !legacyKept) {
      setFightErr('Pick the opponent from the list, or create them as a new fighter.')
      return
    }
    setSavingFight(true)
    try {
      if (legacyKept) {
        // old fight with a free-text opponent: stays unlinked
        await updateFighter(fighter.id, {
          fights: fighter.fights.map((f) => (f.id === editingId ? { ...f, ...form } : f)),
        })
      } else {
        const opp = fighters.find((x) => x.id === form.opponentId)
        await saveBout(fighter.id, fullName(fighter), opp ? fullName(opp) : form.opponent, editingId, form)
      }
      setForm(blank); setShowForm(false); setEditingId(null)
    } catch (err) {
      console.error(err)
      setFightErr('Could not save the fight.')
    } finally {
      setSavingFight(false)
    }
  }

  function editFight(f: Fight) {
    const { id, ...rest } = f
    setForm({ ...rest, opponent: oppName(f) }); setEditingId(id); setShowForm(true)
    setLegacyName(f.opponentId ? '' : f.opponent); setFightErr('')
  }

  async function removeFight(f: Fight) {
    const linked = !!f.opponentId && fighters.some((x) => x.id === f.opponentId)
    if (!confirm(linked ? `Delete this fight? It will also be removed from ${oppName(f)}'s history.` : 'Delete this fight?')) return
    await deleteBout(fighter.id, f.id)
  }

  async function removeFighter() {
    if (!confirm(`Delete ${fullName(fighter)}? This cannot be undone.`)) return
    await deleteFighter(fighter.id)
    onClose()
  }

  const stats: [string, string][] = ([
    ['Age', fighter.age], ['Height', fighter.height],
    ['Reach', fighter.reach && `${fighter.reach}"`], ['Weight', fighter.weight && `${fighter.weight} lbs`],
    ['Stance', fighter.stance], ['Nationality', fighter.nationality], ['Team', fighter.team],
  ] as [string, string][]).filter(([, v]) => v)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container rk-modal rk-profile animate-scaleIn">
        <div className="modal-header">
          <h2 className="modal-title">Fighter Profile</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="rk-hero">
            <Avatar f={fighter} size={110} />
            <div className="rk-hero-info">
              <h3 className="rk-name">{isChamp && <Crown size={28} />} {fullName(fighter)}</h3>
              {fighter.nickname && <p className="rk-nick">“{fighter.nickname}”</p>}
              <div className="rk-record">
                <RecordBadge fights={fighter.fights} />
                <span className="rk-record-sub">{rec.kos} KO/TKO · overall</span>
              </div>
              {enrolled.length > 0 && (
                <div className="rk-cat-records">
                  {enrolled.map((c) => {
                    const r = getRecord(fighter.fights.filter((f) => f.categoryId === c.id))
                    return (
                      <span key={c.id} className="badge rk-badge">
                        {c.championId === fighter.id && <Crown size={12} />} {c.name} {r.text}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="rk-hero-actions">
              <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={removeFighter}>Delete</button>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="rk-stats">
              {stats.map(([k, v]) => (
                <div key={k} className="rk-stat"><span>{k}</span><b>{v}</b></div>
              ))}
            </div>
          )}
          {fighter.notes && <p className="rk-notes">{fighter.notes}</p>}

          {enrolled.length > 0 && (
            <div className="rk-titles">
              <span className="rk-titles-label">Titles</span>
              {enrolled.map((c) => (
                <button key={c.id} type="button"
                  className={`rk-title-btn ${c.championId === fighter.id ? 'active' : ''}`}
                  onClick={() => onToggleChamp(c.id)}>
                  <Crown size={13} /> {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="rk-section-head">
            <h4>Fight history</h4>
            <button className="btn btn-gold btn-sm" onClick={() => { setForm(blank); setEditingId(null); setFightErr(''); setShowForm(!showForm) }}>
              {showForm ? 'Cancel' : '+ Add fight'}
            </button>
          </div>

          {showForm && (
            <form className="rk-fight-form" onSubmit={saveFight}>
              <div className="rk-result-toggle">
                {(['win', 'loss', 'draw'] as FightResult[]).map((r) => (
                  <button type="button" key={r}
                    className={`rk-result-btn rk-${r} ${form.result === r ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, result: r })}>
                    {RESULT_LABEL[r]}
                  </button>
                ))}
              </div>
              <div className="rk-grid">
                {enrolled.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                      {enrolled.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {form.categoryId && !enrolled.some((c) => c.id === form.categoryId) && (
                        <option value={form.categoryId}>{catName(form.categoryId)} (no longer enrolled)</option>
                      )}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Opponent *</label>
                  <OpponentPicker candidates={fighters.filter((x) => x.id !== fighter.id)}
                    text={form.opponent} selectedId={form.opponentId} categoryId={form.categoryId}
                    onChange={(text, id) => setForm({ ...form, opponent: text, opponentId: id })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                    {FIGHT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Event</label>
                  <input className="form-input" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Round</label>
                  <input className="form-input" type="number" min={1} value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              {fightErr && <div className="login-error">{fightErr}</div>}
              <p className="rk-empty">The fight is saved on both fighters' histories (result mirrored).</p>
              <button className="btn btn-gold" type="submit" disabled={savingFight}>{savingFight ? 'Saving…' : editingId ? 'Update fight' : 'Save fight'}</button>
            </form>
          )}

          {sorted.length === 0 ? (
            <p className="rk-empty">No fights registered yet.</p>
          ) : (
            <div className="rk-fights">
              {sorted.map((f) => (
                <div key={f.id} className={`rk-fight rk-${f.result}`}>
                  <span className="rk-fight-res">{f.result === 'win' ? 'W' : f.result === 'loss' ? 'L' : 'D'}</span>
                  <div className="rk-fight-main">
                    <b>vs {oppName(f)}</b>
                    <span>
                      {[catName(f.categoryId), f.method, f.round && `R${f.round}`, f.event, f.date].filter(Boolean).join(' · ')}
                    </span>
                    {f.notes && <em>{f.notes}</em>}
                  </div>
                  <button className="btn-icon" title="Edit" onClick={() => editFight(f)}>✎</button>
                  <button className="btn-icon" title="Delete" onClick={() => removeFight(f)}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────── Page ───────────── */
const P4P = 'p4p'

export default function RankingsPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<WeightCategory[]>([])
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [activeId, setActiveId] = useState<string>(P4P)
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [formMode, setFormMode] = useState<null | 'create' | 'edit'>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => subscribeToCategories(setCategories), [])
  useEffect(() => subscribeToFighters(setFighters), [])
  useEffect(() => {
    if (activeId !== P4P && categories.length > 0 && !categories.find((c) => c.id === activeId)) setActiveId(P4P)
  }, [categories, activeId])

  const active = activeId === P4P ? null : categories.find((c) => c.id === activeId) ?? null
  const profile = fighters.find((f) => f.id === profileId) ?? null

  const inCategory = (f: Fighter, catId: string) => f.categoryIds.includes(catId)
  const catFights = (f: Fighter, catId: string) => f.fights.filter((x) => x.categoryId === catId)
  const q = search.trim().toLowerCase()
  const matches = (f: Fighter) => !q || `${fullName(f)} ${f.nickname}`.toLowerCase().includes(q)

  const champion = active
    ? fighters.find((f) => f.id === active.championId && inCategory(f, active.id)) ?? null
    : null

  // Ranking of a single category or Pound-for-pound
  const ranked = useMemo(() => {
    if (!active) {
      // Pound-for-pound ranking
      return fighters
        .filter(matches)
        .sort((a, b) => {
          const fa = a.fights, fb = b.fights
          const ra = getRecord(fa), rb = getRecord(fb)
          return getScore(fb) - getScore(fa) || rb.wins - ra.wins || ra.losses - rb.losses || fullName(a).localeCompare(fullName(b))
        })
    }
    return fighters
      .filter((f) => inCategory(f, active.id) && f.id !== champion?.id && matches(f))
      .sort((a, b) => {
        const fa = catFights(a, active.id), fb = catFights(b, active.id)
        const ra = getRecord(fa), rb = getRecord(fb)
        return getScore(fb) - getScore(fa) || rb.wins - ra.wins || ra.losses - rb.losses || fullName(a).localeCompare(fullName(b))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fighters, active, champion?.id, search])

  const addableToActive = active ? fighters.filter((f) => !inCategory(f, active.id)) : []

  async function run(fn: () => Promise<void>) {
    setError('')
    try { await fn() } catch (e) {
      console.error(e)
      const code = (e as { code?: string })?.code
      setError(code === 'permission-denied'
        ? 'Permission denied by Firestore. Update your Firestore rules to allow the "weightCategories" and "fighters" collections.'
        : `Something went wrong${code ? ` (${code})` : ''}.`)
    }
  }

  const addCategory = (name: string) => run(async () => {
    const n = name.trim()
    if (!n) return
    await createCategory(n)
    setNewCat(''); setAddingCat(false)
  })

  const handleRename = (c: WeightCategory) => run(async () => {
    const n = prompt('Rename category', c.name)
    if (n && n.trim()) await renameCategory(c.id, n.trim())
  })

  const handleDeleteCat = (c: WeightCategory) => run(async () => {
    if (!confirm(`Delete category "${c.name}"? Fighters and their fight history are kept; they just leave this category.`)) return
    await deleteCategory(c.id)
  })

  const addExisting = (fighterId: string) => run(async () => {
    const f = fighters.find((x) => x.id === fighterId)
    if (!f || !active) return
    await updateFighter(f.id, { categoryIds: [...f.categoryIds, active.id] })
  })

  const toggleChampion = (categoryId: string, fighterId: string) => run(async () => {
    const cat = categories.find((c) => c.id === categoryId)
    await setChampion(categoryId, cat?.championId === fighterId ? '' : fighterId)
  })

  const renderCard = (f: Fighter, opts: { pos?: number; fights: Fight[]; showCats?: boolean }) => (
    <div key={f.id} className="rk-card" onClick={() => setProfileId(f.id)}>
      {opts.pos !== undefined
        ? <span className={`rk-pos ${opts.pos < 3 ? `rk-pos-${opts.pos + 1}` : ''}`}>{opts.pos + 1}</span>
        : null}
      <Avatar f={f} />
      <div className="rk-card-info">
        <b>
          {categories.some((c) => c.championId === f.id && inCategory(f, c.id)) && <Crown size={14} />} {fullName(f)}
        </b>
        {f.nickname && <span>“{f.nickname}”</span>}
        {opts.showCats && (
          <div className="rk-cat-records">
            {categories.filter((c) => inCategory(f, c.id)).map((c) => (
              <span key={c.id} className="badge rk-badge">{c.name}</span>
            ))}
          </div>
        )}
      </div>
      <RecordBadge fights={opts.fights} />
    </div>
  )

  return (
    <div className="rankings-page">
      <header className="rk-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')} id="rankings-back-btn">← Calendar</button>
        <h1 className="rk-title">Fighter Rankings</h1>
        <span />
      </header>
      {error && <div className="login-error" style={{ margin: '8px 24px 0' }}>{error}</div>}

      <div className="rk-layout">
        <aside className="rk-sidebar">
          <nav className="rk-cats">
            <div className={`rk-cat ${activeId === P4P ? 'active' : ''}`} onClick={() => setActiveId(P4P)} id="p4p-tab">
              <span className="rk-cat-name">Pound-for-pound</span>
              <span className="rk-cat-count">{fighters.length}</span>
            </div>
          </nav>
          <div className="rk-side-head" style={{ marginTop: 16 }}>
            <span>Categories</span>
            <button className="btn-icon" title="New category" onClick={() => setAddingCat(!addingCat)} id="add-category-btn">＋</button>
          </div>
          {addingCat && (
            <form className="rk-cat-form" onSubmit={(e) => { e.preventDefault(); addCategory(newCat) }}>
              <input autoFocus className="form-input" placeholder="e.g. Middleweight" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button className="btn btn-gold btn-sm" type="submit">Add</button>
            </form>
          )}
          <nav className="rk-cats">
            {categories.map((c) => (
              <div key={c.id} className={`rk-cat ${c.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
                <span className="rk-cat-name">{c.name}</span>
                <span className="rk-cat-count">{fighters.filter((f) => inCategory(f, c.id)).length}</span>
              </div>
            ))}
            {categories.length === 0 && !addingCat && <p className="rk-empty">Create your first category.</p>}
          </nav>
        </aside>

        <main className="rk-main">
          <div className="rk-main-head">
            <div>
              <h2 className="rk-cat-title">{active ? active.name : 'Pound-for-pound'}</h2>
              <span className="rk-sub">
                {active
                  ? `${ranked.length + (champion ? 1 : 0)} fighter${ranked.length + (champion ? 1 : 0) !== 1 ? 's' : ''}`
                  : `${ranked.length} fighter${ranked.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="rk-main-tools">
              <input className="form-input rk-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {active && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRename(active)}>Rename</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(active)}>Delete</button>
                  {addableToActive.length > 0 && (
                    <select className="form-select rk-add-existing" value="" onChange={(e) => e.target.value && addExisting(e.target.value)}>
                      <option value="">+ Add existing…</option>
                      {addableToActive.map((f) => <option key={f.id} value={f.id}>{fullName(f)}</option>)}
                    </select>
                  )}
                </>
              )}
              <button className="btn btn-gold btn-sm" onClick={() => setFormMode('create')} id="add-fighter-btn">+ Fighter</button>
            </div>
          </div>

          {!active ? (
            ranked.length === 0
              ? <div className="rk-placeholder"><p>No fighters yet.</p></div>
              : <div className="rk-list">{ranked.map((f, i) => renderCard(f, { pos: i, fights: f.fights, showCats: true }))}</div>
          ) : (
            <>
              {champion && (
                <div className="rk-card rk-champ" onClick={() => setProfileId(champion.id)}>
                  <span className="rk-pos"><Crown size={30} /></span>
                  <Avatar f={champion} size={64} />
                  <div className="rk-card-info">
                    <span className="rk-champ-label">Champion</span>
                    <b>{fullName(champion)}</b>
                    {champion.nickname && <span>“{champion.nickname}”</span>}
                  </div>
                  <RecordBadge fights={catFights(champion, active.id)} />
                </div>
              )}
              {ranked.length === 0 && !champion ? (
                <div className="rk-placeholder"><p>No fighters in this category yet.</p></div>
              ) : (
                <div className="rk-list">
                  {ranked.map((f, i) => renderCard(f, { pos: i, fights: catFights(f, active.id) }))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {formMode === 'create' && (
        <FighterForm title="New Fighter" categories={categories}
          initial={emptyFighter(active ? [active.id] : [])}
          onSave={createFighter} onClose={() => setFormMode(null)} />
      )}
      {formMode === 'edit' && profile && (
        <FighterForm title="Edit Fighter" categories={categories}
          initial={(({ id, createdAt, ...rest }) => rest)(profile)}
          onSave={async (d) => {
            // fights are managed from the profile, keep the current ones
            await updateFighter(profile.id, { ...d, fights: profile.fights })
          }}
          onClose={() => setFormMode(null)} />
      )}
      {profile && formMode !== 'edit' && (
        <FighterProfile fighter={profile} fighters={fighters} categories={categories}
          onToggleChamp={(catId) => toggleChampion(catId, profile.id)}
          onClose={() => setProfileId(null)} onEdit={() => setFormMode('edit')} />
      )}
    </div>
  )
}
