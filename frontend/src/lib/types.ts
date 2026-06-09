import type { ChromaKeyOptions, Offset } from '../utils/spriteUtils'

export type { ChromaKeyOptions, Offset }

export interface CharacterMeta {
  name: string
  builtin?: boolean
  ip?: string
  workGifs: string[]
  restGifs: string[]
  crawlGifs?: string[]
  angryGifs?: string[]
  shyGifs?: string[]
  miniActions?: Record<string, string[]>
  largeActions?: Record<string, string>
}

export interface AgentInfo {
  id: string
  identityName?: string
  identityEmoji?: string
}

export interface PipelinePreset {
  id: string; name: string; description: string; promptFile: string
  cols: number; rows: number; needsRefImage: boolean
  rowLabels?: string[]; excludeLastFrameRows?: number[]
}

export interface PipelineConfig {
  id: string; name: string; description: string
  presets: PipelinePreset[]; exportMode: 'whole' | 'by-row'; discardLastFrame: boolean
}

export type CardStatus = 'idle' | 'generating' | 'processing' | 'ready' | 'error'

export interface PipelineItem {
  preset: PipelinePreset; status: CardStatus; error?: string
  rawFrames: HTMLCanvasElement[]
  keyedFrames: HTMLCanvasElement[]
  rowGroups: HTMLCanvasElement[][]
  rowLabels: string[]
  globalOffset: Offset
  rowOffsets: Offset[]
}
