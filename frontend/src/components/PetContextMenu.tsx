import type { PetData, PetAction, PomodoroState } from '../lib/petStore'

// Stub components — pet context menu is disabled (appMode is always 'coding')

export function PetContextMenu(_props: {
  open: boolean
  petData: PetData
  currentAction: PetAction
  pomodoro: PomodoroState | null
  mascotSize: number
  side: 'left' | 'right'
  onClose: () => void
  onUpdatePetData: (d: PetData) => void
  onSetAction: (action: PetAction) => void
  onStartPomodoro: (minutes: number) => void
  onStopPomodoro: () => void
  onOpenSettings: () => void
  onStar: () => void
  onFoodRain: (emoji: string) => void
  onPlayAudio: (action: PetAction) => void
  onQuit: () => void
}) {
  return null
}

export function PomodoroOverlay(_props: {
  pomodoro: PomodoroState
  mascotSize: number
  onStop: () => void
}) {
  return null
}
