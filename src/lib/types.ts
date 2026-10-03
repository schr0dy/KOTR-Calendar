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

// --- Rankings ----------------------------------------------------------------

export type FightResult = 'win' | 'loss' | 'draw'

export const FIGHT_METHODS = [
  'KO', 'TKO', 'Submission', 'Decision (Unanimous)', 'Decision (Split)',
  'Decision (Majority)', 'Technical Decision', 'DQ', 'Corner Stoppage', 'Doctor Stoppage', 'No Contest', 'Other',
] as const

export interface Fight {
  id: string
  opponent: string
  result: FightResult
  categoryId: string  // category the fight was fought in
  opponentId: string  // linked fighter (empty for legacy free-text opponents)
  method: string
  date: string      // yyyy-MM-dd (optional, may be empty)
  event: string
  round: string
  notes: string
}

export interface WeightCategory {
  id: string
  name: string
  championId: string
  createdAt: Date
}

export interface Fighter {
  id: string
  categoryIds: string[]
  firstName: string
  lastName: string
  nickname: string
  age: string
  height: string     // cm
  reach: string      // cm
  weight: string     // kg
  stance: string
  nationality: string
  team: string
  photo: string      // small data URL
  notes: string
  fights: Fight[]
  createdAt: Date
}
