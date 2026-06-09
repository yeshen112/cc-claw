import { load } from '@tauri-apps/plugin-store'

// ─── Types (stubs — pet mode disabled) ───

export type AppMode = 'coding' | 'pet'

export type PetAction =
  | 'idle' | 'sleep' | 'work' | 'study' | 'watch' | 'music' | 'walk'
  | 'dance' | 'eat' | 'hungry' | 'headpat' | 'farewell' | 'grasp'
  | 'angry' | 'spin' | 'milktea' | 'rest' | 'peek' | 'walkout'

export interface PetData {
  hunger: number; affection: number; coins: number; lastTickAt: number
  lastDailyGift: string; headpatToday: number; headpatDate: string; pomodoroCoins: number
}

export interface PomodoroState {
  active: boolean; duration: number; remaining: number; startedAt: number
}

export const HUNGER_OFFLINE_FLOOR = 10
export const AFFECTION_MAX = 100
export const AFFECTION_ACTIVITY_PER_10MIN = 1
export const POMODORO_COINS_PER_MIN = 1
export const HUNGER_ACTIVITY_PER_HOUR = 3
export const APP_MODE_ONBOARDING_VERSION = '1'

export function defaultPetData(): PetData {
  return { hunger: 100, affection: 100, coins: 0, lastTickAt: Date.now(), lastDailyGift: '', headpatToday: 0, headpatDate: '', pomodoroCoins: 0 }
}

export function tickPetData(d: PetData): PetData { return d }
export function getAffectionTier(_a: number): string { return 'normal' }
export function canWalk(_d: PetData): boolean { return false }
export function applyHeadpat(d: PetData): PetData { return d }
export function isAppModeOnboardingStale(_v: string | null): boolean { return false }

// ─── Settings store ───

let settingsStorePromise: ReturnType<typeof load> | null = null

function getSettingsStore() {
  if (!settingsStorePromise) {
    settingsStorePromise = load('settings.json', { defaults: {}, autoSave: true })
  }
  return settingsStorePromise
}

// ─── Async stubs ───

export async function loadAppMode(): Promise<AppMode | null> {
  const store = await getSettingsStore()
  const v = await store.get('app_mode')
  return (v === 'pet' || v === 'coding') ? v : null
}

export async function saveAppMode(mode: AppMode): Promise<void> {
  const store = await getSettingsStore()
  await store.set('app_mode', mode)
  await store.save()
}

export async function loadPetData(): Promise<PetData> {
  return defaultPetData()
}

export async function savePetData(_d: PetData): Promise<void> {}

export async function loadAppModeVersion(): Promise<string | null> {
  return null
}

export async function saveAppModeVersion(_v: string): Promise<void> {}

// ─── Mini pet selection (codex-style sprite pet) ───

export async function loadMiniPetId(): Promise<string | null> {
  const store = await getSettingsStore()
  const v = await store.get('mini_pet_id')
  return typeof v === 'string' && v ? v : null
}

export async function saveMiniPetId(id: string): Promise<void> {
  const store = await getSettingsStore()
  await store.set('mini_pet_id', id)
  await store.save()
}
