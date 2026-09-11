import React, { useState } from 'react'
import { logout } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import { TEAM_LABELS, TEAM_COLORS } from '../../lib/types'
import './Header.css'

type CalendarView = 'month' | 'week' | 'day'

interface HeaderProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: Date
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onAdminClick?: () => void
}

function KOTRIcon() {
  return (
    <img src="/kotr-logo.png" alt="KOTR" className="header-logo-icon" />
  )
}

function WindowControls() {
  const api = (window as Window & { electronAPI?: { minimize: () => void; maximize: () => void; close: () => void } }).electronAPI

  if (!api) return null

  return (
    <div className="window-controls">
      <button className="window-btn window-btn--minimize" onClick={() => api.minimize()} title="Minimize" id="win-minimize">
        <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
      </button>
      <button className="window-btn window-btn--maximize" onClick={() => api.maximize()} title="Maximize" id="win-maximize">
        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
      </button>
      <button className="window-btn window-btn--close" onClick={() => api.close()} title="Close" id="win-close">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function formatHeaderDate(date: Date, view: CalendarView): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (view === 'month') {
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  } else if (view === 'week') {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.getDate()} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`
  } else {
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }
}

export default function Header({
  currentView,
  onViewChange,
  currentDate,
  onNavigate,
  onAdminClick,
}: HeaderProps) {
  const { userProfile } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const teamColor = userProfile ? TEAM_COLORS[userProfile.team] : '#C9A84C'
  const teamLabel = userProfile ? TEAM_LABELS[userProfile.team] : ''

  async function handleLogout() {
    await logout()
  }

  return (
    <header className="header" id="app-header">
      <div className="header-left">
        <div className="header-logo">
          <KOTRIcon />
          <div className="header-logo-text">
            <span className="header-logo-title">KOTR</span>
            <span className="header-logo-sub">Calendar</span>
          </div>
        </div>

        <div className="header-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('today')} id="nav-today">Today</button>
          <button className="nav-arrow" onClick={() => onNavigate('prev')} id="nav-prev" aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <button className="nav-arrow" onClick={() => onNavigate('next')} id="nav-next" aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
          <h2 className="header-date">{formatHeaderDate(currentDate, currentView)}</h2>
        </div>
      </div>

      <div className="header-center">
        <div className="view-toggle" role="group" aria-label="Calendar view">
          {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
            <button
              key={view}
              id={`view-${view}`}
              className={`view-toggle-btn ${currentView === view ? 'active' : ''}`}
              onClick={() => onViewChange(view)}
            >
              {view === 'month' ? 'Month' : view === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        {userProfile?.team === 'direction' && onAdminClick && (
          <button className="btn btn-outline btn-sm" onClick={onAdminClick} id="admin-panel-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Users
          </button>
        )}

        <div className="user-menu-container">
          <button className="user-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)} id="user-menu-btn">
            <div className="user-avatar" style={{ borderColor: teamColor }}>
              {userProfile?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="user-info">
              <span className="user-name">{userProfile?.name ?? 'User'}</span>
              <span className="user-team" style={{ color: teamColor }}>{teamLabel}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} />
              <div className="user-menu animate-scaleIn">
                <div className="user-menu-header">
                  <div className="user-avatar user-avatar--lg" style={{ borderColor: teamColor }}>
                    {userProfile?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="user-menu-name">{userProfile?.name}</p>
                    <p className="user-menu-email">{userProfile?.email}</p>
                    <span className="badge" style={{ background: `${teamColor}20`, color: teamColor, marginTop: 4 }}>
                      {teamLabel}
                    </span>
                  </div>
                </div>
                <hr className="divider" />
                <button className="user-menu-item user-menu-item--danger" onClick={handleLogout} id="logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        <WindowControls />
      </div>
    </header>
  )
}
