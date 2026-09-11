export type Team = 'direction' | 'hr' | 'operations' | 'marketing'

export interface UserProfile {
  uid: string
  email: string
  name: string
  team: Team
  role: 'admin' | 'member'  // admin = direction
  createdAt: Date
  createdBy?: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  allDay: boolean
  team: Team
  isMMA: boolean
  createdBy: string        // uid
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export const TEAM_LABELS: Record<Team, string> = {
  direction: 'Direction',
  hr: 'Human Resources',
  operations: 'Operations',
  marketing: 'Marketing',
}

export const TEAM_COLORS: Record<Team, string> = {
  direction: '#C9A84C',
  hr: '#4A9EFF',
  operations: '#2ECC8E',
  marketing: '#FF6B6B',
}

export const TEAM_BG_COLORS: Record<Team, string> = {
  direction: 'rgba(201, 168, 76, 0.12)',
  hr: 'rgba(74, 158, 255, 0.12)',
  operations: 'rgba(46, 204, 142, 0.12)',
  marketing: 'rgba(255, 107, 107, 0.12)',
}
