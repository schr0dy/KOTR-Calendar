import React, { useState, useEffect } from 'react'
import { getAllUsers, createUserAccount, updateUserProfile, deleteUserFromDB } from '../lib/auth'
import type { UserProfile, Team } from '../lib/types'
import { TEAM_LABELS, TEAM_COLORS } from '../lib/types'
import './Admin.css'

const ALL_TEAMS: Team[] = ['direction', 'hr', 'operations', 'marketing']

interface AdminPanelProps {
  onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newTeam, setNewTeam] = useState<Team>('hr')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function loadUsers() {
    setLoading(true)
    try {
      const list = await getAllUsers()
      setUsers(list)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      await createUserAccount(newEmail, newPassword, newName, newTeam, 'admin')
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewTeam('hr')
      setShowCreateForm(false)
      await loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating user.'
      if (msg.includes('email-already-in-use')) {
        setCreateError('A user with this email already exists.')
      } else {
        setCreateError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleTeamChange(uid: string, team: Team) {
    try {
      await updateUserProfile(uid, { team, role: team === 'direction' ? 'admin' : 'member' })
      await loadUsers()
    } catch {
      setError('Failed to update user.')
    }
  }

  async function handleDelete(uid: string) {
    if (!confirm('Are you sure you want to remove this user?')) return
    try {
      await deleteUserFromDB(uid)
      await loadUsers()
    } catch {
      setError('Failed to delete user.')
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal-container admin-panel animate-scaleIn">
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Admin Panel</h2>
          <button className="btn-icon" onClick={onClose} id="admin-close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="admin-toolbar">
            <span className="admin-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-gold btn-sm" onClick={() => setShowCreateForm(!showCreateForm)} id="create-user-btn">
              {showCreateForm ? 'Cancel' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New User
                </>
              )}
            </button>
          </div>

          {showCreateForm && (
            <form className="admin-create-form" onSubmit={handleCreate} id="create-user-form">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-name">Full Name</label>
                  <input id="new-user-name" className="form-input" type="text" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-email">Email</label>
                  <input id="new-user-email" className="form-input" type="email" placeholder="user@kotr.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-password">Password</label>
                  <input id="new-user-password" className="form-input" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-team">Team</label>
                  <select id="new-user-team" className="form-select" value={newTeam} onChange={(e) => setNewTeam(e.target.value as Team)}>
                    {ALL_TEAMS.map((t) => (
                      <option key={t} value={t}>{TEAM_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              {createError && <div className="login-error" style={{ marginTop: 0 }}>{createError}</div>}
              <button className="btn btn-gold" type="submit" disabled={creating} id="submit-create-user-btn">
                {creating ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Create User'}
              </button>
            </form>
          )}

          {error && <div className="login-error">{error}</div>}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="admin-user-list">
              {users.map((user) => {
                const color = TEAM_COLORS[user.team]
                return (
                  <div key={user.uid} className="admin-user-row">
                    <div className="admin-user-avatar" style={{ background: `${color}20`, border: `2px solid ${color}`, color }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-user-info">
                      <span className="admin-user-name">{user.name}</span>
                      <span className="admin-user-email">{user.email}</span>
                    </div>
                    <select className="form-select admin-team-select" value={user.team}
                      onChange={(e) => handleTeamChange(user.uid, e.target.value as Team)}>
                      {ALL_TEAMS.map((t) => (
                        <option key={t} value={t}>{TEAM_LABELS[t]}</option>
                      ))}
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.uid)} title="Remove user">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2 2 0 0 1-2,2H7a2 2 0 0 1-2-2V6m3,0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1,1v2"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
