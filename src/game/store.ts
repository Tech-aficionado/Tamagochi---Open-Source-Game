import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clampNeed, type CareAction, type GameMode, type MiniGameId, type PetNeeds, type StoryEvent, type ThemeId } from './types'

export const STORY_EVENTS: readonly StoryEvent[] = [
  {
    eyebrow: 'A SMALL BEGINNING',
    title: 'Something is tapping from inside the shell…',
    body: 'Two bright eyes appear. The little creature waits for the first sound of its new life.',
    choices: [
      { label: 'Hum a soft hello', reply: 'Mori sways to the tune and remembers it.', bond: 8, joy: 10 },
      { label: 'Tap back twice', reply: 'Tap. Tap. A secret greeting is born.', bond: 6, joy: 14 },
    ],
  },
  {
    eyebrow: 'STORY 01 · THE LOST LIGHT',
    title: 'A tiny light falls from the sky.',
    body: 'Mori cups the flickering spark. It could warm the room—or guide another creature home.',
    choices: [
      { label: 'Hang it by the window', reply: 'The room glows like a remembered summer.', bond: 9, joy: 6 },
      { label: 'Send it home', reply: 'Far away, another pocket world blinks thank you.', bond: 12, joy: 4 },
    ],
  },
  {
    eyebrow: 'STORY 02 · RAIN MUSIC',
    title: 'The rain has forgotten its rhythm.',
    body: 'Drops hover silently above the garden. Mori looks to you for the missing beat.',
    choices: [
      { label: 'Dance the rhythm', reply: 'The rain tumbles down in a laughing chorus.', bond: 10, joy: 12 },
      { label: 'Listen together', reply: 'In the quiet, the rain finds its own song.', bond: 14, joy: 7 },
    ],
  },
]

interface GameState {
  petName: string
  needs: PetNeeds
  bond: number
  ageMinutes: number
  mode: GameMode
  themeId: ThemeId
  lastUpdated: number
  lastAction: CareAction | 'story' | 'activity' | null
  actionNonce: number
  storyIndex: number
  storyOpen: boolean
  lastReply: string | null
  sparks: number
  playStreak: number
  lastActivityDate: string | null
  activityBest: Record<MiniGameId, number>
  tick: () => void
  care: (action: CareAction) => void
  completeActivity: (gameId: MiniGameId, score: number) => void
  chooseStory: (choiceIndex: number) => void
  openStory: () => void
  closeStory: () => void
  setTheme: (themeId: ThemeId) => void
  setMode: (mode: GameMode) => void
  reset: () => void
}

const freshState = () => ({
  petName: 'Mori',
  needs: { hunger: 78, joy: 72, hygiene: 84, energy: 76, health: 92 },
  bond: 4,
  ageMinutes: 0,
  mode: 'cozy' as GameMode,
  themeId: 'sakura' as ThemeId,
  lastUpdated: Date.now(),
  lastAction: null,
  actionNonce: 0,
  storyIndex: 0,
  storyOpen: true,
  lastReply: null,
  sparks: 0,
  playStreak: 0,
  lastActivityDate: null,
  activityBest: { 'star-catch': 0, 'memory-flip': 0 },
})

const CARE_EFFECTS: Record<CareAction, Partial<PetNeeds>> = {
  feed: { hunger: 26, health: 3, hygiene: -4 },
  play: { joy: 28, energy: -10, hunger: -4 },
  wash: { hygiene: 34, joy: 4 },
  rest: { energy: 30, health: 4, hunger: -6 },
  cuddle: { joy: 16, health: 3, energy: 2 },
  explore: { joy: 22, energy: -13, hunger: -9, hygiene: -3 },
}

function decayNeeds(state: Pick<GameState, 'needs' | 'mode' | 'lastUpdated'>, now: number): PetNeeds {
  const rawMinutes = Math.max(0, (now - state.lastUpdated) / 60_000)
  const elapsedMinutes = state.mode === 'cozy' ? Math.min(rawMinutes, 12 * 60) : rawMinutes
  const pace = state.mode === 'cozy' ? 0.58 : 1
  const floor = state.mode === 'cozy' ? 18 : 0
  const hunger = Math.max(floor, state.needs.hunger - elapsedMinutes * 0.55 * pace)
  const joy = Math.max(floor, state.needs.joy - elapsedMinutes * 0.38 * pace)
  const hygiene = Math.max(floor, state.needs.hygiene - elapsedMinutes * 0.28 * pace)
  const energy = Math.max(floor, state.needs.energy - elapsedMinutes * 0.32 * pace)
  const isStruggling = hunger < 18 || hygiene < 16
  const healthDelta = elapsedMinutes * (isStruggling ? -0.4 : 0.08) * pace
  return { hunger, joy, hygiene, energy, health: clampNeed(state.needs.health + healthDelta) }
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...freshState(),
      tick: () => set((state) => {
        const now = Date.now()
        const elapsedMinutes = Math.max(0, (now - state.lastUpdated) / 60_000)
        if (elapsedMinutes < 0.015) return state
        return {
          needs: decayNeeds(state, now),
          ageMinutes: state.ageMinutes + elapsedMinutes,
          lastUpdated: now,
        }
      }),
      care: (action) => set((state) => {
        const now = Date.now()
        const current = decayNeeds(state, now)
        const effects = CARE_EFFECTS[action]
        const needs = { ...current }
        for (const key of Object.keys(effects) as (keyof PetNeeds)[]) {
          needs[key] = clampNeed(needs[key] + (effects[key] ?? 0))
        }
        const bondGain = action === 'cuddle' ? 4 : action === 'play' || action === 'explore' ? 3 : 1.5
        const nextBond = clampNeed(state.bond + bondGain)
        const storyReady = state.storyIndex < STORY_EVENTS.length && nextBond >= state.storyIndex * 10 + 4
        return {
          needs,
          bond: nextBond,
          lastUpdated: now,
          lastAction: action,
          actionNonce: state.actionNonce + 1,
          storyOpen: state.storyOpen || storyReady,
          lastReply: null,
        }
      }),
      completeActivity: (gameId, score) => set((state) => {
        const today = new Date().toISOString().slice(0, 10)
        const previous = state.lastActivityDate ? Date.parse(`${state.lastActivityDate}T00:00:00Z`) : null
        const dayGap = previous === null ? null : Math.round((Date.parse(`${today}T00:00:00Z`) - previous) / 86_400_000)
        const playStreak = dayGap === 0 ? state.playStreak : dayGap === 1 ? state.playStreak + 1 : 1
        const reward = Math.max(3, Math.floor(score / 2))
        return {
          sparks: state.sparks + reward,
          playStreak,
          lastActivityDate: today,
          activityBest: { ...state.activityBest, [gameId]: Math.max(state.activityBest[gameId], score) },
          needs: {
            ...state.needs,
            joy: clampNeed(state.needs.joy + Math.min(28, 8 + score)),
            energy: clampNeed(state.needs.energy - 6),
            hunger: clampNeed(state.needs.hunger - 2),
          },
          bond: clampNeed(state.bond + 2 + score / 10),
          lastAction: 'activity' as const,
          actionNonce: state.actionNonce + 1,
          lastReply: `${state.petName} found ${reward} Sparks in the Tamagochi Arcade!`,
        }
      }),
      chooseStory: (choiceIndex) => set((state) => {
        const event = STORY_EVENTS[state.storyIndex]
        const choice = event?.choices[choiceIndex]
        if (!choice) return state
        return {
          bond: clampNeed(state.bond + choice.bond),
          needs: { ...state.needs, joy: clampNeed(state.needs.joy + choice.joy) },
          storyIndex: state.storyIndex + 1,
          storyOpen: false,
          lastAction: 'story',
          actionNonce: state.actionNonce + 1,
          lastReply: choice.reply,
        }
      }),
      openStory: () => set((state) => ({ storyOpen: state.storyIndex < STORY_EVENTS.length })),
      closeStory: () => set({ storyOpen: false }),
      setTheme: (themeId) => set({ themeId, lastReply: null }),
      setMode: (mode) => set({ mode, lastUpdated: Date.now() }),
      reset: () => set(freshState()),
    }),
    {
      name: 'pocket-worlds-save-v1',
      version: 2,
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<GameState>
        return {
          ...freshState(),
          ...persisted,
          activityBest: { ...freshState().activityBest, ...persisted.activityBest },
        } as GameState
      },
      onRehydrateStorage: () => (state) => state?.tick(),
    },
  ),
)