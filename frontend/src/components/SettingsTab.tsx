import { useState, useEffect, useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  enable as enableAutostartCmd,
  disable as disableAutostartCmd,
  isEnabled as isAutostartEnabled,
} from '@tauri-apps/plugin-autostart'
import { Loader2, Check, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { getStore } from '../lib/store'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-500' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

function CopyCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-1 bg-black/40 rounded overflow-hidden">
      <code className="flex-1 px-2 py-1 text-[11px] text-white/60 font-mono select-all">{text}</code>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="px-1.5 py-1 text-white/30 hover:text-white/60 transition-colors shrink-0"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  )
}

export function SettingsTab({ notifySound, onChangeNotifySound, waitingSound, onToggleWaitingSound, soundEnabled, onToggleSoundEnabled, codexSoundEnabled, onToggleCodexSoundEnabled, cursorSoundEnabled, onToggleCursorSoundEnabled, autoCloseCompletion, onToggleAutoCloseCompletion, autoExpandOnTask, onToggleAutoExpandOnTask, islandBg, onChangeIslandBg, bgPos, onChangeBgPos, panelMaxHeight, onChangePanelMaxHeight, hoverDelay, onChangeHoverDelay, largeMascotScale, onChangeLargeMascotScale, appMode, onChangeAppMode, petSfxEnabled, onTogglePetSfxEnabled, petIdleIntervalMin, onChangePetIdleIntervalMin }: { notifySound: 'default' | 'manbo'; onChangeNotifySound: (v: 'default' | 'manbo') => void; waitingSound: boolean; onToggleWaitingSound: (v: boolean) => void; soundEnabled: boolean; onToggleSoundEnabled: (v: boolean) => void; codexSoundEnabled: boolean; onToggleCodexSoundEnabled: (v: boolean) => void; cursorSoundEnabled: boolean; onToggleCursorSoundEnabled: (v: boolean) => void; autoCloseCompletion: boolean; onToggleAutoCloseCompletion: (v: boolean) => void; autoExpandOnTask: boolean; onToggleAutoExpandOnTask: (v: boolean) => void; islandBg: string; onChangeIslandBg: (v: string) => void; bgPos: { x: number; y: number }; onChangeBgPos: (v: { x: number; y: number }) => void; panelMaxHeight: number; onChangePanelMaxHeight: (v: number) => void; hoverDelay: number; onChangeHoverDelay: (v: number) => void; largeMascotScale: number; onChangeLargeMascotScale: (v: number) => void; appMode?: 'coding' | 'pet' | null; onChangeAppMode?: (v: 'coding' | 'pet') => void; petSfxEnabled?: boolean; onTogglePetSfxEnabled?: (v: boolean) => void; petIdleIntervalMin?: number; onChangePetIdleIntervalMin?: (v: number) => void }) {
  const { t, i18n } = useTranslation()
  const isWindowsPlatform = typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows')
  const [enableClaudeCode, setEnableClaudeCode] = useState(true)
  const [hookStatus, setHookStatus] = useState('')
  const [enableAutostart, setEnableAutostart] = useState(false)
  const [autostartStatus, setAutostartStatus] = useState('')
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null)
  const [bgNaturalSize, setBgNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const showIslandBackgroundSettings = false
  useEffect(() => {
    ;(async () => {
      const store = await getStore()
      const cc = await store.get('enable_claudecode')
      if (typeof cc === 'boolean') setEnableClaudeCode(cc)
      try {
        const sysEnabled = await isAutostartEnabled()
        setEnableAutostart(sysEnabled)
        await store.set('enable_autostart', sysEnabled)
        await store.save()
      } catch {
        // ignore
      }
    })()
    if (showIslandBackgroundSettings) {
      invoke('list_backgrounds').then((list: any) => setBackgrounds(list as string[])).catch(() => {})
    }
  }, [])

  // Load preview image for current background
  useEffect(() => {
    if (!showIslandBackgroundSettings || !islandBg) return
    // Try public path first (bundled), fallback to Rust command (custom)
    const img = new Image()
    img.onload = () => { setBgPreviewUrl(img.src); setBgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => {
      invoke('get_background_data', { fileName: islandBg }).then((dataUrl: any) => {
        const img2 = new Image()
        img2.onload = () => { setBgPreviewUrl(dataUrl as string); setBgNaturalSize({ w: img2.naturalWidth, h: img2.naturalHeight }) }
        img2.src = dataUrl as string
      }).catch(() => {})
    }
    img.src = `/assets/backgrounds/${islandBg}`
  }, [islandBg])

  // Handle file upload for custom background
  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const saved = await invoke('save_background', { fileName: file.name, dataUrl }) as string
        // Refresh list and select
        const list = await invoke('list_backgrounds') as string[]
        setBackgrounds(list)
        onChangeIslandBg(saved)
      } catch (e: any) { console.error('save bg:', e) }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [onChangeIslandBg])

  // Drag handler for crop rectangle
  const handleCropDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const container = cropContainerRef.current
    if (!container || !bgNaturalSize) return
    draggingRef.current = true
    const rect = container.getBoundingClientRect()
    const update = (clientX: number, clientY: number) => {
      // The crop rect aspect ratio is ~7:1 (island width:height)
      // Container shows full image, crop rect shows visible portion
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      onChangeBgPos({ x: Math.round(x), y: Math.round(y) })
    }
    const isTouch = 'touches' in e
    if (isTouch) {
      const t = (e as React.TouchEvent).touches[0]
      update(t.clientX, t.clientY)
    } else {
      update((e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY)
    }
    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return
      const p = 'touches' in ev ? (ev as TouchEvent).touches[0] : (ev as MouseEvent)
      update(p.clientX, p.clientY)
    }
    const onUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
  }, [bgNaturalSize, onChangeBgPos])

  const toggleClaudeCode = async (val: boolean) => {
    setEnableClaudeCode(val)
    const store = await getStore()
    await store.set('enable_claudecode', val)
    await store.save()
    if (val) {
      try {
        await invoke('install_claude_hooks')
        setHookStatus(t('settings.hookInstalled'))
      } catch (e: any) {
        setHookStatus(`${t('settings.hookFailed')} ${String(e)}`)
      }
    }
  }

  const toggleAutostart = async (val: boolean) => {
    setEnableAutostart(val)
    setAutostartStatus('')
    try {
      if (val) await enableAutostartCmd()
      else await disableAutostartCmd()
      const store = await getStore()
      await store.set('enable_autostart', val)
      await store.save()
    } catch (e: any) {
      setEnableAutostart(!val)
      setAutostartStatus(`${t('settings.autostartFailed', 'Failed to update autostart')} ${String(e)}`)
    }
  }

  const isPetMode = appMode === 'pet'

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-20 px-6 flex flex-col gap-10">
      {/* App Mode Switch */}
      {appMode && onChangeAppMode && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-white">{t('settings.appMode', 'Mode')}</h2>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden p-4">
            <div className="flex gap-3">
              {([
                { mode: 'coding' as const, label: t('settings.codingMode'), icon: '💻', desc: t('settings.codingModeDesc') },
                { mode: 'pet' as const, label: t('settings.petMode'), icon: '🐾', desc: t('settings.petModeDesc') },
              ]).map(({ mode, label, icon, desc }) => (
                <button
                  key={mode}
                  onClick={() => onChangeAppMode(mode)}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    appMode === mode
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div className="text-left">
                    <div className={`text-sm font-medium ${appMode === mode ? 'text-white' : 'text-white/60'}`}>{label}</div>
                    <div className="text-[11px] text-white/30">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pet mode: mascot size */}
      {isPetMode && !isWindowsPlatform && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-white">{t('settings.display')}</h2>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white/90">{t('settings.largeMascotScale', 'Large Mascot Size')}</span>
                  <span className="text-xs text-white/40">{t('settings.largeMascotScaleDesc', 'Scale multiplier for large mascot mode')}</span>
                </div>
                <span className="text-sm text-white/60 tabular-nums">{largeMascotScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={4}
                max={6}
                step={0.1}
                value={largeMascotScale}
                onChange={(e) => onChangeLargeMascotScale(Number(e.target.value))}
                className="w-full accent-white/60 h-1"
              />
            </div>
          </div>
        </section>
      )}

      {/* Pet mode: character voice toggle */}
      {isPetMode && onTogglePetSfxEnabled && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-white">{t('settings.sound')}</h2>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">{t('settings.petSfx')}</span>
                <span className="text-xs text-white/40">{t('settings.petSfxDesc')}</span>
              </div>
              <Toggle checked={petSfxEnabled ?? true} onChange={onTogglePetSfxEnabled} />
            </div>
          </div>
        </section>
      )}

      {/* Pet mode: random idle action interval */}
      {isPetMode && onChangePetIdleIntervalMin && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-white">{t('settings.petBehavior', 'Behavior')}</h2>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white/90">{t('settings.petIdleInterval', 'Random action interval')}</span>
                  <span className="text-xs text-white/40">{t('settings.petIdleIntervalDesc', 'How often the mascot triggers a random action while idle')}</span>
                </div>
                <span className="text-sm text-white/60 tabular-nums">
                  {(petIdleIntervalMin ?? 2).toFixed(1)} {t('settings.minutesShort', 'min')}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={30}
                step={0.5}
                value={petIdleIntervalMin ?? 2}
                onChange={(e) => onChangePetIdleIntervalMin(Number(e.target.value))}
                className="w-full accent-white/60 h-1"
              />
            </div>
          </div>
        </section>
      )}

      {!isPetMode && <>
      {/* Claude Code */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-white">Claude Code</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.enableClaudeCli', 'Enable Claude Code CLI')}</span>
              <span className="text-xs text-white/40">{t('settings.enableClaudeCliDesc', 'Monitor local Claude Code CLI sessions via Hooks')}</span>
              {hookStatus && <span className="text-xs text-white/30 mt-1">{hookStatus}</span>}
            </div>
            <Toggle checked={enableClaudeCode} onChange={toggleClaudeCode} />
          </div>
        </div>
      </section>

      {/* 显示设置 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-white">{t('settings.display')}</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.autoExpandOnTask', 'Auto Popup')}</span>
              <span className="text-xs text-white/40">{t('settings.autoExpandOnTaskDesc', 'Automatically expand panel when a task completes or needs input')}</span>
            </div>
            <Toggle checked={autoExpandOnTask} onChange={onToggleAutoExpandOnTask} />
          </div>
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">{t('settings.panelMaxHeight', 'Panel Height')}</span>
                <span className="text-xs text-white/40">{t('settings.panelMaxHeightDesc', 'Maximum height of the expanded panel')}</span>
              </div>
              <span className="text-sm text-white/60 tabular-nums">{panelMaxHeight}px</span>
            </div>
            <input
              type="range"
              min={200}
              max={500}
              step={10}
              value={panelMaxHeight}
              onChange={(e) => onChangePanelMaxHeight(Number(e.target.value))}
              className="w-full accent-white/60 h-1"
            />
          </div>
          <div className={`p-4 ${showIslandBackgroundSettings ? 'border-b border-white/5' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">{t('settings.hoverDelay', 'Hover Trigger Delay')}</span>
                <span className="text-xs text-white/40">{t('settings.hoverDelayDesc', 'Delay before expanding panel on hover')}</span>
              </div>
              <span className="text-sm text-white/60 tabular-nums">{hoverDelay.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={hoverDelay}
              onChange={(e) => onChangeHoverDelay(Number(e.target.value))}
              className="w-full accent-white/60 h-1"
            />
          </div>
          {!isWindowsPlatform && (
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">{t('settings.largeMascotScale', 'Large Mascot Size')}</span>
                <span className="text-xs text-white/40">{t('settings.largeMascotScaleDesc', 'Scale multiplier for large mascot mode')}</span>
              </div>
              <span className="text-sm text-white/60 tabular-nums">{largeMascotScale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={0.1}
              value={largeMascotScale}
              onChange={(e) => onChangeLargeMascotScale(Number(e.target.value))}
              className="w-full accent-white/60 h-1"
            />
          </div>
          )}
          {showIslandBackgroundSettings && (
            <div className="p-4">
              <div className="flex flex-col gap-1 mb-3">
                <span className="text-sm font-medium text-white/90">{t('settings.islandBg')}</span>
                <span className="text-xs text-white/40">{t('settings.islandBgDesc')}</span>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                <button
                  onClick={() => onChangeIslandBg('__anime__')}
                  className={`relative w-14 h-9 rounded-lg overflow-hidden border-2 transition-all ${islandBg === '__anime__' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                >
                  <div style={{ width: '100%', height: '100%', background: '#F0D140' }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(to right, #00000015 1px, transparent 1px), linear-gradient(to bottom, #00000015 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                  </div>
                </button>
                {backgrounds.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => onChangeIslandBg(bg)}
                    className={`relative w-14 h-9 rounded-lg overflow-hidden border-2 transition-all ${islandBg === bg ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url(/assets/backgrounds/${bg})`, backgroundSize: 'cover' }} />
                  </button>
                ))}
                <label className="relative w-14 h-9 rounded-lg overflow-hidden border-2 border-dashed border-white/20 hover:border-white/40 transition-all cursor-pointer flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white/40" />
                  <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                </label>
              </div>

              {islandBg !== '__anime__' && bgPreviewUrl && bgNaturalSize && (
                <div className="flex flex-col items-center gap-2">
                  <div
                    ref={cropContainerRef}
                    className="relative rounded-lg overflow-hidden cursor-crosshair select-none"
                    style={{ width: '100%', maxWidth: 360, aspectRatio: `${bgNaturalSize.w} / ${bgNaturalSize.h}` }}
                    onMouseDown={handleCropDrag}
                    onTouchStart={handleCropDrag}
                  >
                    <img src={bgPreviewUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                    {(() => {
                      const cropAspect = 7
                      const imgAspect = bgNaturalSize.w / bgNaturalSize.h
                      let cropW: number, cropH: number
                      if (imgAspect > cropAspect) {
                        cropH = 100
                        cropW = (cropAspect / imgAspect) * 100
                      } else {
                        cropW = 100
                        cropH = (imgAspect / cropAspect) * 100
                      }
                      const maxX = 100 - cropW
                      const maxY = 100 - cropH
                      const left = (bgPos.x / 100) * maxX
                      const top = (bgPos.y / 100) * maxY
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${left}%`, top: `${top}%`,
                            width: `${cropW}%`, height: `${cropH}%`,
                            border: '2px solid white',
                            borderRadius: 4,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                          }}
                        />
                      )
                    })()}
                  </div>
                  <div className="rounded-lg overflow-hidden border border-white/10" style={{ width: '100%', maxWidth: 360, height: 50 }}>
                    <div style={{
                      width: '100%', height: '100%',
                      backgroundImage: `url(${bgPreviewUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 提示音 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-white">{t('settings.sound')}</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.completionSound')}</span>
              <span className="text-xs text-white/40">{t('settings.completionSoundDesc')}</span>
            </div>
            <div className="flex bg-black/50 p-0.5 rounded-lg border border-white/5">
              {(['default', 'manbo'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeNotifySound(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${notifySound === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  {s === 'default' ? t('settings.defaultSound') : t('settings.manboSound')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.ccSound', 'Claude Code Completion Sound')}</span>
              <span className="text-xs text-white/40">{t('settings.ccSoundDesc', 'Play sound when Claude Code finishes a task')}</span>
            </div>
            <Toggle checked={soundEnabled} onChange={onToggleSoundEnabled} />
          </div>
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.waitingSound')}</span>
              <span className="text-xs text-white/40">{t('settings.waitingSoundDesc')}</span>
            </div>
            <Toggle checked={waitingSound} onChange={onToggleWaitingSound} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.autoCloseCompletion', 'Auto-close Completion Popup')}</span>
              <span className="text-xs text-white/40">{t('settings.autoCloseCompletionDesc', 'Automatically close the completion popup after 5 seconds')}</span>
            </div>
            <Toggle checked={autoCloseCompletion} onChange={onToggleAutoCloseCompletion} />
          </div>
        </div>
      </section>

      </>}
      {/* 系统 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-white">{t('settings.system', 'System')}</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.autostart', 'Launch on Login')}</span>
              <span className="text-xs text-white/40">{t('settings.autostartDesc', 'Start cc-claw automatically when you log in')}</span>
              {autostartStatus && <span className="text-xs text-red-400 mt-1 break-all">{autostartStatus}</span>}
            </div>
            <Toggle checked={enableAutostart} onChange={toggleAutostart} />
          </div>
        </div>
      </section>

      {/* 关于 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-white">{t('settings.about')}</h2>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">{t('settings.version', 'Version')}</span>
              <span className="text-xs text-white/40">v1.8.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* Exit app */}
      <section className="pt-4">
        <button
          onClick={() => invoke('exit_app').catch(() => {})}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
        >
          {t('settings.exitApp')}
        </button>
      </section>
    </div>
  )
}
