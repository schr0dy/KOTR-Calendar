import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { createEvent, updateEvent, deleteEvent, canEditEvent, canDeleteEvent } from '../../lib/events'
import { useAuth } from '../../contexts/AuthContext'
import type { CalendarEvent, Team } from '../../lib/types'
import { TEAM_LABELS, TEAM_COLORS } from '../../lib/types'
import './EventModal.css'

const ALL_TEAMS: Team[] = ['direction', 'hr', 'operations', 'marketing']

interface EventModalProps {
  event?: CalendarEvent | null
  defaultDate?: Date
  defaultEndDate?: Date   // ← for drag-to-create multi-day range
  onClose: () => void
}

function formatDateTimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

function formatDateLocal(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function EventModal({ event, defaultDate, defaultEndDate, onClose }: EventModalProps) {
  const { userProfile } = useAuth()

  const isEditing = !!event
  const isDirection = userProfile?.team === 'direction'
  const canEdit = event && userProfile ? canEditEvent(event, userProfile) : true
  const canDelete = event && userProfile ? canDeleteEvent(event, userProfile) : false

  const defaultStart = defaultDate ?? new Date()
  // If dragged, defaultEndDate already set and allDay=true makes sense
  const hasRange = !!defaultEndDate && defaultEndDate.getTime() !== defaultStart.getTime()
  const defaultEnd = defaultEndDate ?? new Date(defaultStart.getTime() + 3600 * 1000)

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? hasRange)
  const [start, setStart] = useState(() => {
    if (event) return event.allDay ? formatDateLocal(event.start) : formatDateTimeLocal(event.start)
    return hasRange ? formatDateLocal(defaultStart) : formatDateTimeLocal(defaultStart)
  })
  const [end, setEnd] = useState(() => {
    if (event) return event.allDay ? formatDateLocal(event.end) : formatDateTimeLocal(event.end)
    return hasRange ? formatDateLocal(defaultEnd) : formatDateTimeLocal(defaultEnd)
  })
  const [isMMA, setIsMMA] = useState(event?.isMMA ?? false)
  // Team selector — Direction can choose any team; default to their own or the event's team
  const [selectedTeam, setSelectedTeam] = useState<Team>(
    event?.team ?? (userProfile?.team as Team) ?? 'direction'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sync input type when allDay changes
  useEffect(() => {
    if (allDay) {
      try { setStart(formatDateLocal(new Date(start))) } catch { /* keep */ }
      try { setEnd(formatDateLocal(new Date(end))) } catch { /* keep */ }
    } else {
      try {
        const d = new Date(start)
        if (isNaN(d.getTime())) return
        d.setHours(9, 0)
        setStart(formatDateTimeLocal(d))
        const e = new Date(d)
        e.setHours(10, 0)
        setEnd(formatDateTimeLocal(e))
      } catch { /* keep */ }
    }
  }, [allDay])

  const teamColor = TEAM_COLORS[selectedTeam] ?? '#C9A84C'

  async function handleSave() {
    if (!userProfile) return
    if (!title.trim()) { setError('Title is required.'); return }
    if (!start || !end) { setError('Dates are required.'); return }

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { setError('Invalid dates.'); return }
    if (endDate <= startDate && !allDay) { setError('End must be after start.'); return }

    setLoading(true)
    setError('')

    try {
      const teamOverride: Team | undefined = isDirection ? selectedTeam : undefined

      if (isEditing && event) {
        await updateEvent(
          event.id,
          { title, description, start: startDate, end: endDate, allDay, isMMA },
          userProfile,
          event,
          teamOverride
        )
      } else {
        await createEvent(
          { title, description, start: startDate, end: endDate, allDay, isMMA, team: selectedTeam, createdBy: userProfile.uid, createdByName: userProfile.name },
          userProfile,
          teamOverride
        )
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving event.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!event || !userProfile) return
    setLoading(true)
    try {
      await deleteEvent(event.id, userProfile, event)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting event.')
    } finally {
      setLoading(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const eventColor = isMMA ? '#C9A84C' : teamColor

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container event-modal" style={{ '--event-color': eventColor } as React.CSSProperties}>
        <div className="event-modal-accent" />

        <div className="modal-header">
          <div className="modal-title-group">
            {isMMA && <span className="mma-badge">⭐ MMA</span>}
            <h2 className="modal-title" id="modal-title">
              {isEditing ? 'Edit Event' : 'New Event'}
            </h2>
            {isEditing && event && !isDirection && (
              <span className="badge" style={{ background: `${TEAM_COLORS[event.team]}20`, color: TEAM_COLORS[event.team] }}>
                {TEAM_LABELS[event.team]}
              </span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close" id="modal-close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {isEditing && !canEdit && (
            <div className="event-readonly-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              View only — created by {event?.createdByName}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="event-title">Title *</label>
            <input id="event-title" className="form-input" type="text" placeholder="Event name" value={title}
              onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} maxLength={100} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="event-description">Description</label>
            <textarea id="event-description" className="form-textarea" placeholder="Optional description" value={description}
              onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} maxLength={500} />
          </div>

          {/* Team selector — Direction only */}
          {isDirection && canEdit && (
            <div className="form-group">
              <label className="form-label" htmlFor="event-team">
                Team
                <span className="direction-badge">Direction · can assign to any team</span>
              </label>
              <div className="team-select-grid">
                {ALL_TEAMS.map((team) => {
                  const color = TEAM_COLORS[team]
                  const active = selectedTeam === team
                  return (
                    <button
                      key={team}
                      type="button"
                      className={`team-select-btn ${active ? 'active' : ''}`}
                      style={{ '--t-color': color } as React.CSSProperties}
                      onClick={() => setSelectedTeam(team)}
                      id={`team-select-${team}`}
                    >
                      <span className="team-dot" style={{ background: color }} />
                      {TEAM_LABELS[team]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Non-Direction: show own team as readonly */}
          {!isDirection && !isEditing && userProfile && (
            <div className="event-team-info">
              <span className="form-label">Team</span>
              <span className="badge" style={{ background: `${teamColor}20`, color: teamColor }}>
                {TEAM_LABELS[userProfile.team]}
              </span>
            </div>
          )}

          <label className="form-checkbox-row">
            <input id="event-allday" type="checkbox" className="form-checkbox" checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)} disabled={!canEdit} />
            <span className="form-label" style={{ margin: 0 }}>All Day</span>
          </label>

          <div className="event-dates-row">
            <div className="form-group">
              <label className="form-label" htmlFor="event-start">{allDay ? 'Start Date' : 'Start'}</label>
              <input id="event-start" className="form-input" type={allDay ? 'date' : 'datetime-local'}
                value={start} onChange={(e) => setStart(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="event-end">{allDay ? 'End Date' : 'End'}</label>
              <input id="event-end" className="form-input" type={allDay ? 'date' : 'datetime-local'}
                value={end} onChange={(e) => setEnd(e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div className="mma-toggle-row">
            <label className="form-checkbox-row">
              <input id="event-mma" type="checkbox" className="form-checkbox" checked={isMMA}
                onChange={(e) => setIsMMA(e.target.checked)} disabled={!canEdit} />
              <div>
                <span className="form-label" style={{ margin: 0, color: isMMA ? '#C9A84C' : undefined }}>
                  ⭐ MMA Event
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Will appear in gold in the calendar
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isEditing && canDelete && !confirmDelete && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)} id="delete-event-btn" disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2 2 0 0 1-2,2H7a2 2 0 0 1-2-2V6m3,0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1,1v2"/>
              </svg>
              Delete
            </button>
          )}

          {confirmDelete && (
            <div className="confirm-delete-row">
              <span style={{ fontSize: 12, color: '#FF8080' }}>Confirm delete?</span>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} id="confirm-delete-btn" disabled={loading}>Yes, delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)} disabled={loading}>Cancel</button>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading} id="cancel-event-btn">Cancel</button>

          {canEdit && (
            <button className="btn btn-gold btn-sm" onClick={handleSave} disabled={loading} id="save-event-btn">
              {loading ? (
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  {isEditing ? 'Save' : 'Create Event'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
