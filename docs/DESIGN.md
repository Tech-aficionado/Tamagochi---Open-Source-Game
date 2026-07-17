# Tamagochi product and technical notes

## Scope

Tamagochi is an original browser virtual-pet game for people who enjoy small daily rituals and cozy games. It supports desktop and mobile play, can be installed as a PWA, and keeps solo play available offline.

The project does not use Tamagotchi characters or assets. It also avoids chat, advertising, paid mechanics, and real-time multiplayer.

## Visual direction

The game treats each device as a pocket-sized diorama. Chunky toy shapes frame a soft 3D room, and changing the shell also changes the lighting, materials, particles, and atmosphere inside it.

## Architecture

The TypeScript simulation owns care rules, time progression, incidents, rewards, and save compatibility. React renders the controls and readable status information. React Three Fiber turns the current game state into Mori's pose, room, lighting, and effects.

Browser storage is the source of truth. The game has no required backend or account system.

## Product rules

- Keep Mori recognizable as the central character.
- Make every care action readable through both motion and text.
- Preserve offline play and immediate local saving.
- Keep rewards cosmetic rather than paid or competitive.
- Add content through data where possible so stories, themes, and keepsakes remain easy to extend.
- Respect reduced-motion preferences and lower-powered mobile devices.

## Technical decisions

1. Game rules stay separate from rendering so they can be balanced and tested without a browser scene.
2. Saved data is treated as untrusted and normalized before use.
3. Derived values such as growth stage and dominant personality are calculated rather than duplicated in storage.
4. Timed actions settle from one timestamp to avoid inconsistent decay or rewards.
5. New 3D details use a limited number of low-poly objects to protect mobile performance.

## Living progression

Care, stories, incidents, and Arcade results add growth and shape Gentle, Playful, or Curious traits. Mori moves from Seedling to Bloom and then Luminary. Incidents stay active until the matching care action is used; Cozy mode keeps them harmless, while Classic mode applies limited health pressure.

Sparks earned in the Arcade unlock wearables and room keepsakes. Device themes remain free, and cosmetics do not change game balance.

## Known limitations

- Saves are tied to one browser profile and are not synchronized across tabs or devices.
- Clearing site data can remove progress.
- Local clock or save editing can affect progression in this offline-only game.
- Mobile GPU performance varies, so an optional quality control is still planned.
- The project needs deterministic simulation tests and browser-level smoke tests.
