import React from 'react'
import { format, isSameDay, startOfToday } from 'date-fns'
import type { CalendarEvent } from '../../lib/types'
import { TEAM_LABELS, TEAM_COLORS } from '../../lib/types'
import './Sidebar.css'

type Team = 'direction' | 'hr' | 'operations' | 'marketing'

const ALL_TEAMS: Team[] = ['direction', 'hr', 'operations', 'marketing']

interface SidebarProps {
  visibleTeams: Set<string>
  onToggleTeam: (team: Team) => void
  onNewEvent: () => void
  events: CalendarEvent[]
  currentDate: Date
}

export default function Sidebar({ visibleTeams, onToggleTeam, onNewEvent, events, currentDate }: SidebarProps) {
  const today = startOfToday()
  const todayEvents = events
    .filter((e) => isSameDay(e.start, today))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const upcomingEvents = events
    .filter((e) => e.start > today && !isSameDay(e.start, today))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5)

  return (
    <aside className="sidebar">
      <button className="btn btn-gold sidebar-new-btn" onClick={onNewEvent} id="sidebar-new-event-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Event
      </button>

      {/* Team filters */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Teams</h3>
        <div className="sidebar-teams">
          {ALL_TEAMS.map((team) => {
            const color = TEAM_COLORS[team]
            const active = visibleTeams.has(team)
            const count = events.filter((e) => e.team === team).length
            return (
              <button
                key={team}
                className={`sidebar-team-btn ${active ? 'active' : ''}`}
                style={{ '--team-color': color } as React.CSSProperties}
                onClick={() => onToggleTeam(team)}
                id={`filter-team-${team}`}
              >
                <span className="sidebar-team-check">
                  {active ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : null}
                </span>
                <span className="team-dot" style={{ background: color }} />
                <span className="sidebar-team-name">{TEAM_LABELS[team]}</span>
                <span className="sidebar-team-count">{count}</span>
              </button>
            )
          })}

          <div className="sidebar-mma-info">
            <span className="sidebar-mma-label">⭐ MMA Events</span>
            <span className="sidebar-team-count">
              {events.filter((e) => e.isMMA).length}
            </span>
          </div>
        </div>
      </div>

      {/* Today's events */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Today</h3>
        {todayEvents.length === 0 ? (
          <p className="sidebar-empty">No events today</p>
        ) : (
          <div className="sidebar-event-list">
            {todayEvents.map((event) => {
              const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
              return (
                <div key={event.id} className="sidebar-event-item" style={{ borderLeft: `3px solid ${color}` }}>
                  <span className="sidebar-event-title">
                    {event.isMMA && '⭐ '}{event.title}
                  </span>
                  {!event.allDay && (
                    <span className="sidebar-event-time" style={{ color }}>
                      {format(event.start, 'HH:mm')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Upcoming</h3>
          <div className="sidebar-event-list">
            {upcomingEvents.map((event) => {
              const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
              return (
                <div key={event.id} className="sidebar-event-item" style={{ borderLeft: `3px solid ${color}` }}>
                  <span className="sidebar-event-date" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {format(event.start, 'MMM dd')}
                  </span>
                  <span className="sidebar-event-title">
                    {event.isMMA && '⭐ '}{event.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
