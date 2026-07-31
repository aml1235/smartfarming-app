export type SectorId = 'kandang' | 'kolam' | 'hidroponik' | 'irigasi'
export type PageId = SectorId | 'overview' | 'notifications' | 'settings'
export type AppView = 'landing' | 'login' | 'superadmin' | 'dashboard'
export type StatusLevel = 'baik' | 'normal' | 'peringatan' | 'kritis'
export type AdminTab = 'dashboard' | 'users' | 'assign' | 'activity' | 'settings'

export interface Sector {
  id: string | number
  sector_id?: string
  name: string
  unit: string
  icon?: string
  color?: string
  colorLight?: string
  status: StatusLevel
  lastUpdate?: string
  metrics?: any
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator'
  avatar: string
  assignedSectors: SectorId[]
  isActive: boolean
  lastLogin: string
}

export interface AppNotification {
  id: string
  message: string
  type: 'alert' | 'info' | 'success' | 'warning'
  sectorId?: SectorId
  timestamp: string
  read: boolean
}

export interface ActivityLog {
  id: string
  action: string
  user: string
  timestamp: string
  type: 'user' | 'sector' | 'system'
}