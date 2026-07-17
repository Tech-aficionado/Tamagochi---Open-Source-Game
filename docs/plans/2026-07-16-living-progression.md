# Living progression implementation notes

This update connected Mori's care history to evolution, incidents, and cosmetic rewards.

## Domain model

Progression rules live in `src/game/progression.ts`, while shared game types remain in `src/game/types.ts`. The model defines growth stages, personality scores, incidents, keepsakes, cooldowns, purchases, and equipment rules.

## Save compatibility

`src/game/save.ts` validates each saved field before it enters the game. The storage schema moved to version 3 without changing the existing `pocket-worlds-save-v1` key.

Timed updates use one sampled timestamp per action. This keeps need decay, incident pressure, cooldowns, and rewards consistent when the game resumes after being closed.

## Growth Studio

The Growth Studio shows:

- Mori's current form and strongest personality trait
- Progress toward the next form
- Gentle, Playful, and Curious trait values
- Active incidents and the care action that resolves them
- Six cosmetic keepsakes with purchase and equipment states

All status information is available as text and does not depend only on color or the 3D scene.

## 3D changes

Mori's proportions and markings now reflect the current growth stage and personality. Equipped wearables and room items appear in the scene, and active incidents add a small visual signal. These additions preserve the original silhouette, care poses, camera, themes, and reduced-motion behavior.

## Validation

The update was checked with ESLint, TypeScript compilation, a production build, dependency auditing, malformed-save probes, and targeted checks for timing, cooldowns, purchases, and equipment.
