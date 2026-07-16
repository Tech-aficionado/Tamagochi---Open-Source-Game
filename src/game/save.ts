import {
  INITIAL_INCIDENT_DELAY_MS,
  KEEPSAKE_BY_ID,
  isIncidentId,
  isKeepsakeId,
  isPersonalityId,
  utcDateKey,
} from './progression'
import type {
  ActionSignal,
  ActiveIncident,
  GameMode,
  GameSnapshot,
  KeepsakeId,
  MiniGameId,
  PersonalityScores,
  PetNeeds,
  ThemeId,
} from './types'

const MODES: readonly GameMode[] = ['cozy', 'classic']
const THEMES: readonly ThemeId[] = ['sakura', 'cyber', 'moss', 'moon']
const MINI_GAMES: readonly MiniGameId[] = ['star-catch', 'memory-flip']
const ACTIONS: readonly ActionSignal[] = ['feed', 'play', 'wash', 'rest', 'cuddle', 'explore', 'story', 'activity', 'workshop', null]
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const finite = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const bounded = (value: unknown, fallback: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, finite(value, fallback)))
const integer = (value: unknown, fallback: number, minimum: number, maximum: number) => Math.floor(bounded(value, fallback, minimum, maximum))
const validDate = (value: unknown, now: number) => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp)) return null
  const exactDate = new Date(timestamp).toISOString().slice(0, 10)
  return exactDate === value && value <= utcDateKey(now) ? value : null
}
const validTimestamp = (value: unknown, fallback: number, now: number, futureLimit = now) => bounded(value, fallback, 0, futureLimit)

export const freshSnapshot = (now = Date.now()): GameSnapshot => ({
  petName: 'Mori',
  needs: { hunger: 78, joy: 72, hygiene: 84, energy: 76, health: 92 },
  bond: 4,
  ageMinutes: 0,
  mode: 'cozy',
  themeId: 'sakura',
  lastUpdated: now,
  lastAction: null,
  actionNonce: 0,
  storyIndex: 0,
  storyOpen: true,
  lastReply: null,
  sparks: 0,
  playStreak: 0,
  lastActivityDate: null,
  activityBest: { 'star-catch': 0, 'memory-flip': 0 },
  personalityScores: { gentle: 1, playful: 1, curious: 1 },
  personalityFocus: 'gentle',
  growthPoints: 0,
  growthCooldownUntil: now,
  lastGrowthActivityDate: null,
  activeIncident: null,
  nextIncidentAt: now + INITIAL_INCIDENT_DELAY_MS,
  ownedItemIds: [],
  equippedWearable: null,
  equippedRoomItem: null,
})

const normalizeNeeds = (value: unknown, fallback: PetNeeds): PetNeeds => {
  const needs = isRecord(value) ? value : {}
  return {
    hunger: bounded(needs.hunger, fallback.hunger, 0, 100),
    joy: bounded(needs.joy, fallback.joy, 0, 100),
    hygiene: bounded(needs.hygiene, fallback.hygiene, 0, 100),
    energy: bounded(needs.energy, fallback.energy, 0, 100),
    health: bounded(needs.health, fallback.health, 0, 100),
  }
}

const normalizeActivityBest = (value: unknown): Record<MiniGameId, number> => {
  const best = isRecord(value) ? value : {}
  return Object.fromEntries(MINI_GAMES.map((id) => [id, integer(best[id], 0, 0, 1_000_000)])) as Record<MiniGameId, number>
}

const normalizeScores = (value: unknown): PersonalityScores => {
  const scores = isRecord(value) ? value : {}
  return {
    gentle: bounded(scores.gentle, 1, 1, 999),
    playful: bounded(scores.playful, 1, 1, 999),
    curious: bounded(scores.curious, 1, 1, 999),
  }
}

const normalizeOwnedItems = (value: unknown): KeepsakeId[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isKeepsakeId))]
}

const normalizeIncident = (value: unknown, now: number): ActiveIncident | null => {
  if (!isRecord(value) || !isIncidentId(value.id)) return null
  const startedAt = finite(value.startedAt, Number.NaN)
  const lastPenaltyAt = finite(value.lastPenaltyAt, Number.NaN)
  if (!Number.isFinite(startedAt) || !Number.isFinite(lastPenaltyAt) || startedAt < 0 || startedAt > now) return null
  return {
    id: value.id,
    startedAt,
    lastPenaltyAt: Math.max(startedAt, Math.min(now, lastPenaltyAt)),
  }
}

const normalizeEquipment = (value: unknown, owned: readonly KeepsakeId[], category: 'wearable' | 'room') => {
  if (!isKeepsakeId(value) || !owned.includes(value)) return null
  return KEEPSAKE_BY_ID[value].category === category ? value : null
}

export const normalizeSnapshot = (value: unknown, now = Date.now()): GameSnapshot => {
  const fresh = freshSnapshot(now)
  const source = isRecord(value) ? value : {}
  const needs = normalizeNeeds(source.needs, fresh.needs)
  const bond = bounded(source.bond, fresh.bond, 0, 100)
  const storyIndex = integer(source.storyIndex, 0, 0, 3)
  const ownedItemIds = normalizeOwnedItems(source.ownedItemIds)
  const activeIncident = normalizeIncident(source.activeIncident, now)
  const rawGrowth = finite(source.growthPoints, Number.NaN)
  const growthPoints = Number.isFinite(rawGrowth)
    ? Math.max(0, Math.min(100_000, rawGrowth))
    : Math.min(119, Math.floor(bond * 0.4) + storyIndex * 12)
  const rawDeadline = finite(source.nextIncidentAt, Number.NaN)
  const nextIncidentAt = activeIncident
    ? null
    : Number.isFinite(rawDeadline) && rawDeadline >= 0 && rawDeadline <= now + 24 * 60 * 60_000
      ? rawDeadline
      : now + INITIAL_INCIDENT_DELAY_MS
  const lastUpdated = validTimestamp(source.lastUpdated, now, now)
  const action = ACTIONS.includes(source.lastAction as ActionSignal) ? source.lastAction as ActionSignal : null
  const reply = typeof source.lastReply === 'string' && source.lastReply.length <= 500 ? source.lastReply : null
  const petName = typeof source.petName === 'string' && source.petName.trim() ? source.petName.trim().slice(0, 30) : fresh.petName
  const mode = MODES.includes(source.mode as GameMode) ? source.mode as GameMode : fresh.mode
  const themeId = THEMES.includes(source.themeId as ThemeId) ? source.themeId as ThemeId : fresh.themeId
  const personalityFocus = isPersonalityId(source.personalityFocus) ? source.personalityFocus : fresh.personalityFocus

  return {
    petName,
    needs,
    bond,
    ageMinutes: bounded(source.ageMinutes, 0, 0, 10_000_000),
    mode,
    themeId,
    lastUpdated,
    lastAction: action,
    actionNonce: integer(source.actionNonce, 0, 0, Number.MAX_SAFE_INTEGER),
    storyIndex,
    storyOpen: typeof source.storyOpen === 'boolean' ? source.storyOpen : storyIndex === 0,
    lastReply: reply,
    sparks: integer(source.sparks, 0, 0, 1_000_000),
    playStreak: integer(source.playStreak, 0, 0, 1_000_000),
    lastActivityDate: validDate(source.lastActivityDate, now),
    activityBest: normalizeActivityBest(source.activityBest),
    personalityScores: normalizeScores(source.personalityScores),
    personalityFocus,
    growthPoints,
    growthCooldownUntil: validTimestamp(source.growthCooldownUntil, now, now, now + 5 * 60_000),
    lastGrowthActivityDate: validDate(source.lastGrowthActivityDate, now),
    activeIncident,
    nextIncidentAt,
    ownedItemIds,
    equippedWearable: normalizeEquipment(source.equippedWearable, ownedItemIds, 'wearable'),
    equippedRoomItem: normalizeEquipment(source.equippedRoomItem, ownedItemIds, 'room'),
  }
}
