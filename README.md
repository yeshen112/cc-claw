<p align="center">
  <img src="icon.png" width="80" />
</p>
<h1 align="center">CC-Claw</h1>
<p align="center">
  A desktop pet that watches your Claude Code sessions in real time.
</p>

## What it does

- 🐱 Animated desktop pet that reacts to Claude Code activity — works alongside your AI agent
- 🟢 **Working** — pet animates while Claude Code is thinking or running tools
- 😴 **Idle** — pet rests when Claude Code is inactive
- ⏳ **Waiting** — pet alerts you when Claude Code needs permission
- 📋 Expandable panel shows session list and live conversation history
- 🎨 Custom character animations and backgrounds (GIF / sprite sheet / video)
- 🔊 Completion and permission-request sound effects
- 🖥️ macOS notch island and Windows taskbar positioning

## Requirements

- macOS or Windows
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed

## How it works

```
Claude Code  ──→  Hooks  ──→  Event parser  ──→  Activity state
                                                     ↓
                         Animated sprites  ←  State machine  ←  Sound effects
```

CC-Claw installs Claude Code hooks that forward session events in real time.
Activity states drive the desktop pet animations, with an expandable panel for
session details and chat previews.

## Development

```bash
cd frontend
npm install
npx tauri dev
```

## Tech Stack

- **Tauri v2** + **React** + **TypeScript** — frontend
- **Rust** — system interaction, hook server, window management
- macOS / Windows native APIs

## Credits

Forked from [oc-claw](https://github.com/rainnoon/oc-claw) by rainnoon.
Design inspiration from [Notchi](https://github.com/sk-ruban/notchi).

## License

MIT — see [LICENSE](LICENSE) for details.
