# Memocho

A minimal, lightweight, Mac-style persistent workspace for Windows.

> **Small when you need it. Powerful when you want it.**

## 💡 Core Product Idea

The application combines a persistent floating notes window, a full notes workspace, a daily to-do system inspired by Tweek, a simple planner, customizable appearance, and cloud synchronization. It is designed to feel like a small native Windows utility that happens to contain notes and daily planning—not a heavy productivity suite.

## 🎭 Primary User Experience

The application has two primary modes operating on the same underlying data:

### Floating Mode
A small window that remains visible while working in other applications (coding, studying, browsing, writing).
- Always-on-top
- Pin/unpin, move anywhere, free resizing
- Adjustable opacity, background customization (gradients, transparency)
- Minimal/frameless appearance
- Quick show/hide, minimize to system tray, global keyboard shortcut

### Full Workspace Mode
Expands the floating window into a full application containing:
- Today (Daily tasks)
- Notes
- Tasks
- Planner
- Pinned items
- Settings

## ✅ Daily To-Do System
A simple, Tweek-inspired daily planning system.
- Create, complete, reorder, assign dates, set priorities, and add descriptions to tasks.
- Move tasks between dates.
- View today's and upcoming tasks.
- *Intentionally simple (not a Jira/Notion/Trello clone).*

## 📝 Notes
Usable in both floating and full workspace modes.
- Title, Text/rich text, Markdown support, Checklists, Tags, Pinning, Search
- Automatic saving
- **Notes → Tasks:** Seamlessly convert items in a note into actionable daily tasks.

## 🛠️ Technology Stack

- **Desktop Framework:** Tauri 2 (No Electron)
- **Native/Desktop Layer (Rust):** Handles window management (always-on-top, positioning, resizing), global shortcuts, system tray, local persistence/cache.
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Editor:** TipTap (if rich-text is needed)
- **Build Tool:** Vite
- **Cloud Backend:** Cloudflare Workers (exposes the API)
- **Database:** Cloudflare D1
- **Local-first support:** Lightweight local cache/state so interaction remains fast and offline-resilient.

## 🏗️ Architecture

```text
                    Windows
                       │
                    Tauri 2
                 ┌─────┴─────┐
                 │           │
              React        Rust
                 │           │
                 └─────┬─────┘
                       │
                Local state/cache
                       │
                    HTTPS
                       │
              Cloudflare Worker
                       │
                  Cloudflare D1
```

## 🚀 Performance Requirements
Performance is a first-class feature designed to work smoothly across low-end to high-end PCs.
- **Prioritize:** Low RAM/CPU usage, fast startup, fast UI interactions, minimal background processes, offline resilience.
- **Avoid:** Heavy libraries, Electron, large UI frameworks, unnecessary animations/polling/network requests. The app should consume almost no CPU when idle.

## 🎨 Visual Design
Inspired by Apple's simplicity without copying their UI.
- Minimal, calm, premium, modern, clean, and lightweight.
- Lots of whitespace, subtle borders, small rounded corners, clean typography, minimal icons, subtle shadows/gradients.
- *Avoid:* Clutter, excessive colors, large dashboards, enterprise-style interfaces.

## 🌓 Themes & Windows Integration
- Light/Dark mode, custom backgrounds, gradients, opacity, font sizing.
- Native Windows integration: minimize to tray, start with Windows, remember window position/dimensions/opacity/appearance.

## 🎯 MVP Scope
The initial application focuses on:
- Floating notes & Full workspace
- Notes & Daily tasks
- Always-on-top, Window resizing/moving, Opacity, Background/gradient
- Local state & Cloud synchronization
- Light/dark mode, System tray, Global shortcut

Future features (calendar integrations, AI, reminders, etc.) should be architecturally possible but won't complicate the MVP.

## 👨‍💻 Author

- GitHub: [NirvanJain](https://github.com/NirvanJain)
