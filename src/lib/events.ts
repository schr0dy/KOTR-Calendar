import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { CalendarEvent, UserProfile } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function docToEvent(id: string, data: Record<string, unknown>): CalendarEvent {
  return {
    id,
    title: data.title as string,
    description: (data.description as string) ?? '',
    start: (data.start as Timestamp).toDate(),
    end: (data.end as Timestamp).toDate(),
    allDay: (data.allDay as boolean) ?? false,
    team: data.team as CalendarEvent['team'],
    isMMA: (data.isMMA as boolean) ?? false,
    createdBy: data.createdBy as string,
    createdByName: (data.createdByName as string) ?? '',
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export function canEditEvent(event: CalendarEvent, user: UserProfile): boolean {
  if (user.team === 'direction') return true
  return event.createdBy === user.uid
}

export function canDeleteEvent(event: CalendarEvent, user: UserProfile): boolean {
  if (user.team === 'direction') return true
  return event.createdBy === user.uid
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeToEvents(
  callback: (events: CalendarEvent[]) => void,
  options?: { teamFilter?: string[] }
) {
  let q = query(collection(db, 'events'), orderBy('start', 'asc'))

  if (options?.teamFilter && options.teamFilter.length > 0) {
    q = query(
      collection(db, 'events'),
      where('team', 'in', options.teamFilter),
      orderBy('start', 'asc')
    )
  }

  return onSnapshot(q, (snap) => {
    const events: CalendarEvent[] = snap.docs.map((d) =>
      docToEvent(d.id, d.data() as Record<string, unknown>)
    )
    callback(events)
  })
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createEvent(
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
  user: UserProfile,
  teamOverride?: CalendarEvent['team']  // Direction/admin can create on behalf of any team
): Promise<string> {
  const now = Timestamp.now()
  // Use teamOverride if Direction; otherwise always use creator's team
  const team = (user.team === 'direction' && teamOverride) ? teamOverride : user.team
  const docRef = await addDoc(collection(db, 'events'), {
    title: data.title,
    description: data.description,
    start: Timestamp.fromDate(data.start),
    end: Timestamp.fromDate(data.end),
    allDay: data.allDay,
    team,
    isMMA: data.isMMA,
    createdBy: user.uid,
    createdByName: user.name,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateEvent(
  eventId: string,
  data: Partial<Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt' | 'team'>>,
  user: UserProfile,
  event: CalendarEvent,
  teamOverride?: CalendarEvent['team']  // Direction can reassign team on edit too
): Promise<void> {
  if (!canEditEvent(event, user)) {
    throw new Error('You do not have permission to edit this event.')
  }

  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  }

  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.start !== undefined) updates.start = Timestamp.fromDate(data.start)
  if (data.end !== undefined) updates.end = Timestamp.fromDate(data.end)
  if (data.allDay !== undefined) updates.allDay = data.allDay
  if (data.isMMA !== undefined) updates.isMMA = data.isMMA
  if (user.team === 'direction' && teamOverride) updates.team = teamOverride

  await updateDoc(doc(db, 'events', eventId), updates)
}

export async function deleteEvent(
  eventId: string,
  user: UserProfile,
  event: CalendarEvent
): Promise<void> {
  if (!canDeleteEvent(event, user)) {
    throw new Error('You do not have permission to delete this event.')
  }
  await deleteDoc(doc(db, 'events', eventId))
}
