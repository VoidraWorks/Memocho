# Memocho

> **Your lightweight workspace that stays with you.**

Memocho is a **minimal, lightweight Windows desktop productivity workspace** designed for people who want their notes and daily tasks available without constantly switching between applications.

Keep Memocho floating beside your work, pin it to the screen, customize its appearance, and expand it into a full productivity workspace whenever you need more space.

Built with a strong focus on **performance, simplicity, and a native desktop experience**.

---

## Why Memocho?

Windows has plenty of note-taking and productivity applications, but many of them are designed as full applications that require you to constantly switch context.

Memocho takes a different approach.

It stays with you.

Whether you're coding in VS Code, browsing the web, studying, or working on a project, Memocho can remain as a small floating workspace on your screen.

When you need more functionality, simply expand it.

### Small when you need it. Powerful when you want it.

---

## Core Features

### Floating Workspace

Keep Memocho visible while working in other applications.

* Always-on-top mode
* Pin / unpin
* Move anywhere on the screen
* Freely resize
* Adjustable opacity
* Custom backgrounds
* Gradient backgrounds
* Transparency support
* Minimal window controls
* Quick show / hide
* Global keyboard shortcut
* System tray support

---

### Full Workspace

Expand Memocho whenever you need a larger workspace.

The full application provides:

* **Today**
* **Notes**
* **Tasks**
* **Planner**
* **Pinned**
* **Settings**

The floating and full modes use the same underlying data, so nothing gets lost when switching between them.

---

### Daily To-Do

A simple daily planning experience inspired by lightweight calendar-based productivity tools.

Create tasks for specific days and quickly manage your daily workload.

* Create tasks
* Complete tasks
* Reorder tasks
* Assign dates
* Set priorities
* Add descriptions
* View upcoming tasks
* Move tasks between dates

The goal is to keep daily planning simple rather than turning Memocho into a complex project-management application.

---

### Notes

Create lightweight notes for ideas, reminders, project planning, and anything else you want to keep nearby.

Notes support:

* Titles
* Rich text
* Checklists
* Markdown-friendly editing
* Tags
* Pinning
* Search
* Automatic saving

---

### Notes → Tasks

Memocho connects notes and tasks.

For example:

```text
Project Ideas

- Fix authentication
- Write tests
- Deploy API
```

can quickly become:

```text
TODAY

□ Fix authentication
□ Write tests
□ Deploy API
```

This keeps planning connected to the things you're already writing down.

---

## Performance First

Performance is one of Memocho's core principles.

Memocho is designed to run smoothly on:

* Low-end Windows laptops
* Older machines
* Mid-range PCs
* High-end systems

The application aims for:

* Fast startup
* Low RAM usage
* Minimal CPU usage while idle
* Minimal background activity
* Offline resilience
* Fast local interactions
* Efficient cloud synchronization

The app should feel like a **small desktop utility**, not a heavy productivity suite.

---

# Tech Stack

## Desktop

**Tauri 2**

Provides the lightweight Windows desktop application layer.

Tauri is preferred over Electron to keep the application smaller and more resource-efficient.

## Native Layer

**Rust**

Used for native desktop functionality such as:

* Window management
* Always-on-top behavior
* Window positioning
* Global shortcuts
* System tray
* Native Windows integration
* Local persistence where required

## Frontend

**React + TypeScript**

Used to build the application interface and workspace.

## Build Tool

**Vite**

Used for fast frontend development and builds.

## Styling

**Tailwind CSS**

Used for the minimal and customizable design system.

## State Management

**Zustand**

Used for lightweight application state management.

## Editor

**TipTap / lightweight editor**

Used for notes and rich-text functionality where necessary.

The editor should remain lightweight and should not introduce unnecessary complexity.

## Backend

**Cloudflare Workers**

Provides the API layer between Memocho and the cloud database.

## Database

**Cloudflare D1**

Stores synchronized application data such as:

* Notes
* Tasks
* Planner data
* User settings

## Architecture

```text
                    MEMOCHO
                       │
                 ┌─────┴─────┐
                 │           │
              React        Rust
           TypeScript       │
                 │           │
                 └─────┬─────┘
                       │
                Tauri 2 Desktop
                       │
                 Local-first
                  data/state
                       │
                     HTTPS
                       │
              Cloudflare Worker
                       │
                  Cloudflare D1
```

---

# Local-First Architecture

Memocho should feel instant regardless of network quality.

Normal interactions should happen locally first:

```text
User action
    ↓
Local state
    ↓
UI updates immediately
    ↓
Background synchronization
    ↓
Cloudflare Worker
    ↓
Cloudflare D1
```

The application should **never depend on a network request for every keystroke or interaction**.

This allows Memocho to remain useful even when the user has a slow or unreliable internet connection.

---

# Design Philosophy

Memocho follows a simple design philosophy:

### Minimal

Every element should have a purpose.

### Lightweight

Performance should never be sacrificed unnecessarily for features.

### Persistent

Memocho should always be easy to access while working.

### Customizable

Users should be able to make their workspace feel like their own.

### Local-first

The application should feel fast locally and synchronize in the background.

### Native

Memocho should feel like a real Windows utility rather than a website packaged as an application.

---

# Visual Style

Memocho uses a clean, calm, minimal visual language.

The design focuses on:

* Generous whitespace
* Subtle borders
* Soft rounded corners
* Clean typography
* Minimal icons
* Subtle shadows
* Restrained gradients
* Optional transparency
* Smooth, lightweight transitions

Available themes:

* Light
* Dark
* System

Users can also customize aspects of their floating workspace such as:

* Background
* Gradient
* Op opacity
* Font size
* Window appearance

---

# Project Structure

A high-level structure:

```text
memocho/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   ├── types/
│   └── App.tsx
│
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   ├── window/
│   │   ├── shortcuts/
│   │   └── main.rs
│   │
│   └── tauri.conf.json
│
├── worker/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── db/
│   │   └── index.ts
│   │
│   └── wrangler.toml
│
├── package.json
└── README.md
```

The frontend, native desktop layer, and cloud backend should remain clearly separated.

---

# MVP

The initial version focuses on the essential experience:

* [ ] Floating notes
* [ ] Expandable full workspace
* [ ] Always-on-top
* [ ] Move and resize window
* [ ] Opacity control
* [ ] Background customization
* [ ] Gradient customization
* [ ] Notes
* [ ] Daily tasks
* [ ] Basic planner
* [ ] Pinned items
* [ ] Local-first state
* [ ] Cloud synchronization
* [ ] Light / dark mode
* [ ] System tray
* [ ] Global shortcut

---

# Future Possibilities

Once the core experience is stable, Memocho can potentially expand with:

* Calendar integrations
* Google Calendar synchronization
* Reminders
* Notifications
* Multiple workspaces
* Import / export
* Markdown export
* Clipboard integration
* Pomodoro timer
* Quick capture
* Mobile companion
* AI-powered organization

These should remain optional and should never compromise the lightweight nature of the core application.

---

# Product Vision

Memocho is not intended to become another giant productivity platform.

Its purpose is much simpler:

> **Give users a small workspace that is always there when they need it.**

Open it.

Write something down.

Pin it.

Continue working.

Add a task.

Expand it when you need more space.

Then get back to work.

---
## Author

**Nirvan Jain**  
[GitHub Profile](https://github.com/NirvanJain)
