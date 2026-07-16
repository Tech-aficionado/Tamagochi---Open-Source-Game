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