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
