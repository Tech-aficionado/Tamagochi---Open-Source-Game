# Tamagochi — Product and Technical Design

## Understanding
- An original browser virtual-pet game for nostalgic adults and cozy-game players.
- Cozy and Classic care modes, evolving needs, stories, collections, and theme-driven worlds.
- Desktop, mobile, installable PWA, offline solo play, and future optional cloud/social features.
- No copied Tamagotchi characters, real-time multiplayer, chat, ads, or paid mechanics.

## Design direction
**Aesthetic:** Pocket-world retro futurism — tactile Japanese toy silhouettes containing soft 3D dioramas.

**DFII:** 15/15 (impact 5 + fit 5 + feasibility 4 + performance 4 − consistency risk 3).

**Differentiation anchor:** changing the device shell transforms the entire miniature world, lighting, materials, particles, interface accent, and pet mood.

## Architecture
The deterministic TypeScript simulation owns care rules and time progression. React owns accessible application UI. React Three Fiber renders Three.js presentation from simulation snapshots. Local persistence is authoritative for offline play; cloud sync can later consume versioned snapshots and an event queue.

## Assumptions
- Target 60 FPS with bounded DPR and a graceful low-power fallback.
- Solo play remains available through network or cloud outages.
- Guest mode stores no personal data; future accounts use minimal profiles.
- Content is data-driven so pets, stories, and themes can expand independently.

## Decision log
1. Use original creatures and device designs to avoid copying protected IP.
2. Use React plus React Three Fiber because UI/content scale outweighs the small runtime cost.
3. Keep simulation independent from rendering for reliable balancing and persistence.
4. Make local saves immediate and cloud functionality optional.
5. Start with a complete vertical slice rather than dozens of shallow placeholders.

## Risks
- Large content scope requires an asset pipeline beyond the vertical slice.
- Cloud accounts and social gifts require backend credentials, policies, and moderation review.
- Mobile GPU variance requires adaptive quality and real-device profiling.

## Living progression expansion
Tamagochi connects three systems through Mori's care history: Living Evolution, Pocket Incidents, and the Spark Workshop. Care patterns shape Gentle, Playful, or Curious personality scores; growth moves through Seedling, Bloom, and Luminary stages. Incidents reuse familiar care actions and remain until helped, with safe Cozy behavior and capped health pressure in Classic. Arcade Sparks purchase original, cosmetic wearables and room keepsakes.

### Progression constraints
- Progression awards are cooldown/day gated so repeated care still helps needs without instantly farming growth.
- Incident deadlines and selections are deterministic and persisted; one incident can be active at a time.
- Local saves are treated as untrusted input and normalized field-by-field under schema v3 while retaining `pocket-worlds-save-v1`.
- Derived stage and personality are not persisted, preventing stale duplicated state.
- New 3D details use bounded low-poly primitives and static reduced-motion presentation.

### Expansion decision log
1. Combined evolution, incidents, and cosmetics instead of three disconnected features to create one care-to-expression loop.
2. Balanced first evolution around 30–60 minutes; deeper evolution remains long-term.
3. Use mode-aware consequences: Cozy incidents never harm health, while Classic pressure is capped and recoverable.
4. Preserve existing Sparks and free device themes; workshop keepsakes are optional cosmetics with no gameplay power.
5. Normalize legacy saves conservatively because historical story choices and care actions cannot be reconstructed.
6. Keep exact timing, catalog, incident, migration, and equipment rules in typed local modules with no new service or dependency.
7. Accept local clock/save editing and cross-tab last-writer-wins as limitations of an offline-only game.
