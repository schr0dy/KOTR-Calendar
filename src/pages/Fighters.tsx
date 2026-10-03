import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToCategories, subscribeToFighters, createFighter, updateFighter, setChampion } from '../lib/fighters'
import type { Fighter, WeightCategory } from '../lib/types'
import { Avatar, Crown, RecordBadge, FighterForm, FighterProfile, fullName, emptyFighter } from './Rankings'
import './Rankings.css'

export default function FightersPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<WeightCategory[]>([])
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [formMode, setFormMode] = useState<null | 'create' | 'edit'>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => subscribeToCategories(setCategories), [])
  useEffect(() => subscribeToFighters(setFighters), [])

  const profile = fighters.find((f) => f.id === profileId) ?? null

  const inCategory = (f: Fighter, catId: string) => f.categoryIds.includes(catId)
  const q = search.trim().toLowerCase()
  const matches = (f: Fighter) => !q || `${fullName(f)} ${f.nickname}`.toLowerCase().includes(q)

  const roster = useMemo(
    () => fighters.filter(matches).sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [fighters, search]
  )

  const toggleChampion = async (categoryId: string, fighterId: string) => {
    try {
      const cat = categories.find((c) => c.id === categoryId)
      await setChampion(categoryId, cat?.championId === fighterId ? '' : fighterId)
    } catch (e) {
      console.error(e)
    }
  }

  const renderCard = (f: Fighter) => (
    <div key={f.id} className="rk-card" onClick={() => setProfileId(f.id)}>
      <Avatar f={f} />
      <div className="rk-card-info">
        <b>
          {categories.some((c) => c.championId === f.id && inCategory(f, c.id)) && <Crown size={14} />} {fullName(f)}
        </b>
        {f.nickname && <span>“{f.nickname}”</span>}
        <div className="rk-cat-records">
          {categories.filter((c) => inCategory(f, c.id)).map((c) => (
            <span key={c.id} className="badge rk-badge">{c.name}</span>
          ))}
        </div>
      </div>
      <RecordBadge fights={f.fights} />
    </div>
  )

  return (
    <div className="rankings-page">
      <header className="rk-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')} id="fighters-back-btn">← Calendar</button>
        <h1 className="rk-title">All Fighters</h1>
        <span />
      </header>

      <div className="rk-layout">
        <main className="rk-main">
          <div className="rk-main-head">
            <div>
              <h2 className="rk-cat-title">Roster</h2>
              <span className="rk-sub">
                {roster.length} fighter{roster.length !== 1 ? 's' : ''} total
              </span>
            </div>
            <div className="rk-main-tools">
              <input className="form-input rk-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn btn-gold btn-sm" onClick={() => setFormMode('create')} id="add-fighter-btn">+ Fighter</button>
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="rk-placeholder"><p>No fighters found. Create the first one with “+ Fighter”.</p></div>
          ) : (
            <div className="rk-list">{roster.map(renderCard)}</div>
          )}
        </main>
      </div>

      {formMode === 'create' && (
        <FighterForm title="New Fighter" categories={categories}
          initial={emptyFighter([])}
          onSave={createFighter} onClose={() => setFormMode(null)} />
      )}
      {formMode === 'edit' && profile && (
        <FighterForm title="Edit Fighter" categories={categories}
          initial={(({ id, createdAt, ...rest }) => rest)(profile)}
          onSave={async (d) => {
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
