# Living Progression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Connect care habits to Mori's evolution, time-based care incidents, and a cosmetic Spark workshop.

**Architecture:** Keep deterministic progression and save normalization in pure TypeScript modules. Zustand coordinates atomic state transitions, React presents an accessible Growth Studio, and React Three Fiber receives derived stage/personality/equipment props for low-poly visual changes.

**Tech Stack:** React 19, TypeScript, Zustand, Three.js, React Three Fiber, CSS, Vite PWA.

---

### Task 1: Progression domain
**Files:** Create `src/game/progression.ts`; modify `src/game/types.ts`.
1. Define stage, personality, incident, and keepsake types.
2. Add typed incident/catalog records and exact balancing constants.
3. Add pure derivation, trait-award, scheduling, purchase, and equipment rules.
4. Verify with TypeScript compilation.

### Task 2: Save-safe simulation
**Files:** Create `src/game/save.ts`; modify `src/game/store.ts`.
1. Normalize every persisted scalar, discriminant, collection, timestamp, and nested object.
2. Upgrade persistence schema to v3 without changing `pocket-worlds-save-v1`.
3. Settle decay and incident damage from one timestamp before timed actions.
4. Add cooldown-gated growth, story/activity traits, deterministic incidents, and atomic workshop actions.
5. Probe malformed migration, time caps, cooldowns, purchases, and equipment with temporary scripts.

### Task 3: Growth Studio
**Files:** Create `src/ui/GrowthStudio.tsx`; modify `src/App.tsx`, `src/styles.css`.
1. Present accessible stage and personality meters with clear cooldown feedback.
2. Add persistent-until-helped incident guidance linked to the care controls.
3. Add six responsive purchase/equip cards with visible costs, shortfalls, and states.
4. Mark mode and rescue controls programmatically and visually.

### Task 4: Living 3D presentation
**Files:** Modify `src/scene/PetScene.tsx`.
1. Pass derived progression and equipment state into the scene.
2. Add stage proportions and one mark per personality without replacing Mori's silhouette.
3. Add one wearable, one room keepsake, and one static incident signal.
4. Preserve all six care poses, click target, camera, themes, and reduced-motion behavior.

### Task 5: Documentation and validation
**Files:** Modify `docs/DESIGN.md`.
1. Record the approved contract and decision log.
2. Run `npm run lint`, `npm run build`, and `npm audit --audit-level=high`.
3. Check editor diagnostics and inspect the final Git diff for unrelated files.
