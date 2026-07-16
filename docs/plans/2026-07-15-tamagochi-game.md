# Tamagochi Virtual Pet Implementation Plan

> **For Kiro:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build a polished, installable browser virtual-pet vertical slice with animated Three.js graphics, care mechanics, story events, transformative device themes, and offline persistence.

**Architecture:** A framework-independent TypeScript simulation feeds a React UI and React Three Fiber scene. Zustand coordinates live state, local storage provides offline continuity, and Vite PWA generates the installable app shell.

**Tech Stack:** Vite, TypeScript, React, Three.js, React Three Fiber, Drei, Zustand, ESLint, vite-plugin-pwa.

---

### Task 1: Foundation and design record
- Create package, TypeScript, Vite/PWA, and lint configuration.
- Record the approved architecture, aesthetic, assumptions, decisions, and risks.
- Verify dependency installation.

### Task 2: Game simulation and content
- Create typed pet needs, care actions, elapsed-time decay, story progression, and save migration.
- Define four complete world themes and a scalable content registry.
- Persist each state transition locally and restore elapsed progress.

### Task 3: Three.js experience
- Build a responsive device shell, miniature room, expressive procedural pet, lighting, particles, shadows, and theme transitions.
- Use delta-time animation and bounded DPR for consistent performance.
- Respect reduced-motion preferences.

### Task 4: Interface and interaction
- Build semantic care controls, status meters, story cards, theme selector, difficulty toggle, reset, and PWA install affordance.
- Support mouse, keyboard, and touch with mobile-first responsive behavior.

### Task 5: Verification
- Run ESLint, TypeScript compilation, production build, and high-severity dependency audit.
- Fix all failures and inspect generated PWA output.
- No automated test suite is added because the user did not request tests.