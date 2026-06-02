<p align="center">
  <img src="icon.png" width="80" />
</p>
<h1 align="center">CC-Claw</h1>
<p align="center">
  实时监控 Claude Code 工作状态的桌面宠物。
</p>

## 功能

- 🐱 动态桌面宠物，实时响应 Claude Code 的工作状态
- 🟢 **工作中** — AI 思考或执行工具时播放工作动画
- 😴 **空闲中** — Claude Code 无活动时宠物休息打盹
- ⏳ **等待中** — Claude Code 需要确认权限时提醒你
- 📋 可展开面板，查看会话列表和实时对话
- 🎨 自定义角色动画和背景（GIF / 精灵图 / 视频）
- 🔊 完成提示音 & 等待提示音
- 🖥️ macOS 刘海岛和 Windows 任务栏定位

## 前置条件

- macOS 或 Windows
- 已安装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## 工作原理

```
Claude Code  ──→  Hooks  ──→  事件解析  ──→  活动状态
                                                ↓
                        角色动画  ←  状态机  ←  提示音效
```

CC-Claw 通过安装 Claude Code Hook 实时接收会话事件，活动状态驱动桌面宠物的动画表现，可展开面板查看会话详情和对话预览。

## 开发

```bash
cd frontend
npm install
npx tauri dev
```

## 技术栈

- **Tauri v2** + **React** + **TypeScript** — 前端
- **Rust** — 系统交互、Hook 服务端、窗口管理
- macOS / Windows 原生 API

## 致谢

基于 [oc-claw](https://github.com/rainnoon/oc-claw) 修改。设计灵感来自 [Notchi](https://github.com/sk-ruban/notchi)。

## 许可证

MIT — 详见 [LICENSE](LICENSE)。
