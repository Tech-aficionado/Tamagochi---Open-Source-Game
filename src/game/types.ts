export type ThemeId = 'sakura' | 'cyber' | 'moss' | 'moon'
export type GameMode = 'cozy' | 'classic'
export type NeedKey = 'hunger' | 'joy' | 'hygiene' | 'energy' | 'health'
export type PetNeeds = Record<NeedKey, number>
export type CareAction = 'feed' | 'play' | 'wash' | 'rest' | 'cuddle' | 'explore'
export type MiniGameId = 'star-catch' | 'memory-flip'
export type PetMood = 'radiant' | 'happy' | 'peckish' | 'sleepy' | 'grumpy' | 'unwell'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  number: string
  tagline: string
  shell: string
  shellDark: string
  accent: string
  ink: string
  screen: string
  sky: string
  ground: string
  glow: string
  particle: string
}

export interface StoryChoice {
  label: string
  reply: string
  bond: number
  joy: number
}

export interface StoryEvent {
  eyebrow: string
  title: string
  body: string
  choices: readonly StoryChoice[]
}

export const clampNeed = (value: number) => Math.max(0, Math.min(100, value))

export function getMood(needs: PetNeeds): PetMood {
  if (needs.health < 30) return 'unwell'
  if (needs.energy < 24) return 'sleepy'
  if (needs.hunger < 28) return 'peckish'
  if (needs.joy < 28 || needs.hygiene < 22) return 'grumpy'
  const average = Object.values(needs).reduce((sum, value) => sum + value, 0) / 5
  return average > 88 ? 'radiant' : average > 64 ? 'happy' : 'peckish'
}