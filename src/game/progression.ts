import type {
  ActiveIncident,
  CareAction,
  GameMode,
  GrowthStageId,
  IncidentId,
  KeepsakeCategory,
  KeepsakeId,
  PersonalityId,
  PersonalityScores,
  PetNeeds,
} from './types'

export const MINUTE_MS = 60_000
export const INITIAL_INCIDENT_DELAY_MS = 2 * MINUTE_MS
export const CARE_GROWTH_COOLDOWN_MS = MINUTE_MS
export const INCIDENT_REWARD_SPARKS = 8
export const INCIDENT_REWARD_GROWTH = 10

export interface PersonalityDefinition {
  id: PersonalityId
  name: string
  glyph: string
  description: string
}

export interface GrowthStageDefinition {
  id: GrowthStageId
  name: string
  minimum: number
  nextAt: number | null
}

export interface IncidentDefinition {
  id: IncidentId
  title: string
  glyph: string
  story: string
  action: CareAction
}

export interface KeepsakeDefinition {
  id: KeepsakeId
  name: string
  glyph: string
  category: KeepsakeCategory
  cost: number
  description: string
}

export const PERSONALITIES: readonly PersonalityDefinition[] = [
  { id: 'gentle', name: 'Gentle', glyph: '♥', description: 'Patient care leaves a warm, steady glow.' },
  { id: 'playful', name: 'Playful', glyph: '✦', description: 'Games and bright surprises make Mori sparkle.' },
  { id: 'curious', name: 'Curious', glyph: '↗', description: 'Discovery and thoughtful rituals open new paths.' },
]

export const GROWTH_STAGES: readonly GrowthStageDefinition[] = [
  { id: 'seedling', name: 'Seedling', minimum: 0, nextAt: 120 },
  { id: 'bloom', name: 'Bloom', minimum: 120, nextAt: 320 },
  { id: 'luminary', name: 'Luminary', minimum: 320, nextAt: null },
]

export const INCIDENTS: readonly IncidentDefinition[] = [
  { id: 'static-cloud', title: 'A Static Cloud', glyph: '⌁', story: 'A fuzzy little storm is following Mori around the room.', action: 'cuddle' },
  { id: 'tangled-sprout', title: 'The Tangled Sprout', glyph: '≈', story: 'Silver garden threads have wrapped around Mori’s paws.', action: 'wash' },
  { id: 'wandering-signal', title: 'A Wandering Signal', glyph: '◇', story: 'A tiny signal is calling from just beyond the pocket world.', action: 'explore' },
]

export const KEEPSAKES: readonly KeepsakeDefinition[] = [
  { id: 'star-ribbon', name: 'Star Ribbon', glyph: '✦', category: 'wearable', cost: 14, description: 'A bright bow for playful days.' },
  { id: 'sprout-crown', name: 'Sprout Crown', glyph: '♧', category: 'wearable', cost: 24, description: 'Two brave leaves grown from a memory.' },
  { id: 'moon-charm', name: 'Moon Charm', glyph: '☾', category: 'wearable', cost: 36, description: 'A quiet orbit worn close to the heart.' },
  { id: 'memory-lantern', name: 'Memory Lantern', glyph: '□', category: 'room', cost: 18, description: 'Keeps one soft story glowing nearby.' },
  { id: 'tiny-garden', name: 'Tiny Garden', glyph: '❋', category: 'room', cost: 30, description: 'A pocket patch of impossible flowers.' },
  { id: 'dream-mobile', name: 'Dream Mobile', glyph: '⋆', category: 'room', cost: 48, description: 'Catches sleepy signals above the room.' },
]

export const CARE_TRAIT: Readonly<Record<CareAction, PersonalityId>> = {
  feed: 'gentle',
  play: 'playful',
  wash: 'curious',
  rest: 'gentle',
  cuddle: 'gentle',
  explore: 'curious',
}

export const PERSONALITY_IDS = PERSONALITIES.map(({ id }) => id)
export const INCIDENT_IDS = INCIDENTS.map(({ id }) => id)
export const KEEPSAKE_IDS = KEEPSAKES.map(({ id }) => id)
export const INCIDENT_BY_ID = Object.fromEntries(INCIDENTS.map((incident) => [incident.id, incident])) as Record<IncidentId, IncidentDefinition>
export const KEEPSAKE_BY_ID = Object.fromEntries(KEEPSAKES.map((item) => [item.id, item])) as Record<KeepsakeId, KeepsakeDefinition>

export const isPersonalityId = (value: unknown): value is PersonalityId => typeof value === 'string' && PERSONALITY_IDS.includes(value as PersonalityId)
export const isIncidentId = (value: unknown): value is IncidentId => typeof value === 'string' && INCIDENT_IDS.includes(value as IncidentId)
export const isKeepsakeId = (value: unknown): value is KeepsakeId => typeof value === 'string' && KEEPSAKE_IDS.includes(value as KeepsakeId)

export const getDominantPersonality = (scores: PersonalityScores, focus: PersonalityId): PersonalityId => {
  const highest = Math.max(...PERSONALITY_IDS.map((id) => scores[id]))
  if (scores[focus] === highest) return focus
  return PERSONALITY_IDS.find((id) => scores[id] === highest) ?? 'gentle'
}

export const applyTraitAward = (scores: PersonalityScores, trait: PersonalityId, amount: number): PersonalityScores => {
  const reduction = amount / 2
  return {
    gentle: Math.max(1, scores.gentle + (trait === 'gentle' ? amount : -reduction)),
    playful: Math.max(1, scores.playful + (trait === 'playful' ? amount : -reduction)),
    curious: Math.max(1, scores.curious + (trait === 'curious' ? amount : -reduction)),
  }
}

export const getGrowthStage = (points: number): GrowthStageDefinition => {
  if (points >= 320) return GROWTH_STAGES[2]
  if (points >= 120) return GROWTH_STAGES[1]
  return GROWTH_STAGES[0]
}

export const getGrowthProgress = (points: number) => {
  const stage = getGrowthStage(points)
  if (stage.nextAt === null) return { stage, percent: 100, remaining: 0 }
  const range = stage.nextAt - stage.minimum
  const progress = Math.max(0, points - stage.minimum)
  return { stage, percent: Math.min(100, progress / range * 100), remaining: Math.max(0, stage.nextAt - points) }
}

export const utcDateKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10)
export const getIncidentDelayMs = (seed: number) => (12 + Math.abs(Math.trunc(seed)) % 7) * MINUTE_MS
export const selectIncidentId = (seed: number): IncidentId => INCIDENTS[Math.abs(Math.trunc(seed)) % INCIDENTS.length].id
export const clampPercent = (value: number) => Math.max(0, Math.min(100, value))

interface TimedState {
  needs: PetNeeds
  mode: GameMode
  lastUpdated: number
  ageMinutes: number
  activeIncident: ActiveIncident | null
  nextIncidentAt: number | null
  actionNonce: number
  storyIndex: number
  ownedItemIds: readonly KeepsakeId[]
}

export interface TimedSettlement {
  needs: PetNeeds
  lastUpdated: number
  ageMinutes: number
  activeIncident: ActiveIncident | null
  nextIncidentAt: number | null
}

export const settleTimedState = (state: TimedState, sampledNow: number): TimedSettlement => {
  const now = Math.max(state.lastUpdated, sampledNow)
  const rawMinutes = Math.max(0, (now - state.lastUpdated) / MINUTE_MS)
  const elapsedMinutes = state.mode === 'cozy' ? Math.min(rawMinutes, 12 * 60) : rawMinutes
  const pace = state.mode === 'cozy' ? 0.58 : 1
  const floor = state.mode === 'cozy' ? 18 : 0
  const hunger = Math.max(floor, state.needs.hunger - elapsedMinutes * 0.55 * pace)
  const joy = Math.max(floor, state.needs.joy - elapsedMinutes * 0.38 * pace)
  const hygiene = Math.max(floor, state.needs.hygiene - elapsedMinutes * 0.28 * pace)
  const energy = Math.max(floor, state.needs.energy - elapsedMinutes * 0.32 * pace)
  const struggling = hunger < 18 || hygiene < 16
  const healthDelta = elapsedMinutes * (struggling ? -0.4 : 0.08) * pace
  let health = clampPercent(state.needs.health + healthDelta)
  let activeIncident = state.activeIncident
  let nextIncidentAt = state.nextIncidentAt

  if (activeIncident) {
    const penaltyStart = Math.max(activeIncident.lastPenaltyAt, state.lastUpdated)
    const penaltyMinutes = Math.min(60, Math.max(0, (now - penaltyStart) / MINUTE_MS))
    if (state.mode === 'classic') health = clampPercent(health - penaltyMinutes * 0.12)
    activeIncident = { ...activeIncident, lastPenaltyAt: Math.max(activeIncident.lastPenaltyAt, now) }
    nextIncidentAt = null
  } else if (nextIncidentAt !== null && now >= nextIncidentAt) {
    const seed = state.actionNonce + state.storyIndex + Math.floor(state.ageMinutes + rawMinutes) + state.ownedItemIds.length
    activeIncident = { id: selectIncidentId(seed), startedAt: now, lastPenaltyAt: now }
    nextIncidentAt = null
  }

  return {
    needs: { hunger, joy, hygiene, energy, health },
    lastUpdated: now,
    ageMinutes: state.ageMinutes + rawMinutes,
    activeIncident,
    nextIncidentAt,
  }
}

export const scheduleIncidentAfterResolution = (
  now: number,
  actionNonce: number,
  storyIndex: number,
  incidentId: IncidentId,
  ownedItemCount: number,
) => {
  const incidentIndex = INCIDENT_IDS.indexOf(incidentId)
  const seed = actionNonce + storyIndex + Math.max(0, incidentIndex) + ownedItemCount
  return now + getIncidentDelayMs(seed)
}

export const canPurchaseKeepsake = (sparks: number, owned: readonly KeepsakeId[], itemId: KeepsakeId) => {
  const item = KEEPSAKE_BY_ID[itemId]
  return !owned.includes(itemId) && sparks >= item.cost
}

export const isEquippable = (owned: readonly KeepsakeId[], itemId: KeepsakeId, category: KeepsakeCategory) => (
  owned.includes(itemId) && KEEPSAKE_BY_ID[itemId].category === category
)
