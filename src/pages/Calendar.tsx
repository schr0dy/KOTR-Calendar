import React, { useState, useEffect } from 'react'
import {
  addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, startOfToday
} from 'date-fns'
import Header from '../components/Header/Header'
import CalendarMonth from '../components/CalendarMonth/CalendarMonth'
import CalendarWeek from '../components/CalendarWeek/CalendarWeek'
import CalendarDay from '../components/CalendarDay/CalendarDay'
import EventModal from '../components/EventModal/EventModal'
import Sidebar from '../components/Sidebar/Sidebar'
import AdminPanel from './Admin'
import { subscribeToEvents } from '../lib/events'
import { useAuth } from '../contexts/AuthContext'
import type { CalendarEvent } from '../lib/types'
import './Calendar.css'

type CalendarView = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { userProfile } = useAuth()
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(startOfToday())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [visibleTeams, setVisibleTeams] = useState<Set<string>>(
    new Set(['direction', 'hr', 'operations', 'marketing'])
  )

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const [defaultEndDate, setDefaultEndDate] = useState<Date | undefined>(undefined)

  // Admin panel
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    const unsub = subscribeToEvents((evts) => setEvents(evts))
    return unsub
  }, [])

  function handleNavigate(direction: 'prev' | 'next' | 'today') {
    if (direction === 'today') { setCurrentDate(startOfToday()); return }
    setCurrentDate((prev) => {
      if (view === 'month') return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
      if (view === 'week') return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
      return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1)
    })
  }

  function openCreateModal(start: Date, end?: Date) {
    setSelectedEvent(null)
    setDefaultDate(start)
    setDefaultEndDate(end)
    setModalOpen(true)
  }

  function handleDateClick(date: Date) {
    openCreateModal(date)
  }

  // Called when user drags from start to end in month view
  function handleDragSelect(start: Date, end: Date) {
    openCreateModal(start, end)
  }

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event)
    setDefaultDate(undefined)
    setDefaultEndDate(undefined)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setSelectedEvent(null)
    setDefaultDate(undefined)
    setDefaultEndDate(undefined)
  }

  return (
    <div className="calendar-page">
      <Header
        currentView={view}
        onViewChange={setView}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onAdminClick={() => setAdminOpen(true)}
      />

      <div className="calendar-layout">
        <Sidebar
          visibleTeams={visibleTeams}
          onToggleTeam={(team) => {
            setVisibleTeams((prev) => {
              const next = new Set(prev)
              next.has(team) ? next.delete(team) : next.add(team)
              return next
            })
          }}
          onNewEvent={() => openCreateModal(new Date())}
          events={events}
          currentDate={currentDate}
        />

        <main className="calendar-main">
          {view === 'month' && (
            <CalendarMonth
              currentDate={currentDate}
              events={events}
              visibleTeams={visibleTeams}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onDragSelect={handleDragSelect}
            />
          )}
          {view === 'week' && (
            <CalendarWeek
              currentDate={currentDate}
              events={events}
              visibleTeams={visibleTeams}
              onSlotClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'day' && (
            <CalendarDay
              currentDate={currentDate}
              events={events}
              visibleTeams={visibleTeams}
              onSlotClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </main>
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => openCreateModal(new Date())}
        title="New Event"
        id="fab-new-event"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {modalOpen && (
        <EventModal
          event={selectedEvent}
          defaultDate={defaultDate}
          defaultEndDate={defaultEndDate}
          onClose={handleModalClose}
        />
      )}

      {adminOpen && (
        <AdminPanel onClose={() => setAdminOpen(false)} />
      )}
    </div>
  )
}
