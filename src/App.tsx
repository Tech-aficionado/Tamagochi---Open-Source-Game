import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react'
import { THEME_BY_ID, THEMES } from './data/themes'
import { getDominantPersonality, getGrowthStage, INCIDENT_BY_ID, MINUTE_MS, settleTimedState } from './game/progression'
import { getStoryBondRequirement, isStoryUnlocked, STORY_EVENTS, useGameStore } from './game/store'
import { getMood, type CareAction, type GameSnapshot, type IncidentId, type NeedKey } from './game/types'
import { useNostalgiaMusic } from './audio/chiptune'
import { ActivityArcade } from './ui/ActivityArcade'
import { FirstRunTutorial } from './ui/FirstRunTutorial'
import { GrowthStudio } from './ui/GrowthStudio'

const PetScene = lazy(() => import('./scene/PetScene').then((module) => ({ default: module.PetScene })))

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const isIosDevice = () => {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    || navigatorWithStandalone.standalone === true
}

const isStandaloneDisplay = () => (
  window.matchMedia('(display-mode: standalone)').matches
  || (navigator as NavigatorWithStandalone).standalone === true
)

const ACTIONS: readonly { id: CareAction; icon: string; label: string; hint: string }[] = [
  { id: 'feed', icon: '●', label: 'Feed', hint: '+ hunger' },
  { id: 'play', icon: '✦', label: 'Play', hint: '+ joy' },
  { id: 'wash', icon: '≈', label: 'Wash', hint: '+ hygiene' },
  { id: 'rest', icon: '☾', label: 'Rest', hint: '+ energy' },
  { id: 'cuddle', icon: '♥', label: 'Cuddle', hint: '+ bond' },
  { id: 'explore', icon: '↗', label: 'Explore', hint: '+ discovery' },
]

const ACTION_FEEDBACK: Record<CareAction, { title: string; detail: string }> = {
  feed: { title: 'SNACK TIME!', detail: 'Munch · munch · happy crunch' },
  play: { title: 'ZOOMIES!', detail: 'Bounce · spin · sparkle' },
  wash: { title: 'BUBBLE BATH!', detail: 'Shake · scrub · shine' },
  rest: { title: 'DREAM MODE', detail: 'Curl up · breathe · restore' },
  cuddle: { title: 'BIG CUDDLE!', detail: 'Hold close · feel safe' },
  explore: { title: 'ADVENTURE!', detail: 'Step out · look around' },
}

const CARE_ACTIONS = new Set<CareAction>(ACTIONS.map((action) => action.id))
const TUTORIAL_KEY = 'tamagochi-tutorial-v1'
const LEGACY_TUTORIAL_KEY = 'poket-worlds-tutorial-v1'

const isTutorialComplete = () => {
  try {
    return window.localStorage.getItem(TUTORIAL_KEY) === 'done'
      || window.localStorage.getItem(LEGACY_TUTORIAL_KEY) === 'done'
  } catch {
    return false
  }
}

const saveTutorialCompletion = () => {
  try {
    window.localStorage.setItem(TUTORIAL_KEY, 'done')
  } catch {
    // The tutorial still closes when storage is unavailable.
  }
}

const isCareAction = (action: string | null): action is CareAction => action !== null && CARE_ACTIONS.has(action as CareAction)

const NEEDS: readonly { id: NeedKey; label: string; glyph: string }[] = [
  { id: 'hunger', label: 'Full', glyph: '●' },
  { id: 'joy', label: 'Joy', glyph: '✦' },
  { id: 'hygiene', label: 'Clean', glyph: '◇' },
  { id: 'energy', label: 'Rest', glyph: '☾' },
  { id: 'health', label: 'Health', glyph: '♥' },
]

const RETURN_BRIEF_MINUTES = 30
const NEED_ACTION: Record<NeedKey, CareAction> = {
  hunger: 'feed',
  joy: 'play',
  hygiene: 'wash',
  energy: 'rest',
  health: 'cuddle',
}

interface ReturnBrief {
  awayMinutes: number
  changedNeed: NeedKey
  needDrop: number
  incidentId: IncidentId | null
  recommendedAction: CareAction
}

const createReturnBrief = (snapshot: GameSnapshot, now = Date.now()): ReturnBrief | null => {
  const awayMinutes = Math.floor(Math.max(0, now - snapshot.lastUpdated) / MINUTE_MS)
  if (awayMinutes < RETURN_BRIEF_MINUTES) return null

  const settled = settleTimedState(snapshot, now)
  const changedNeed = NEEDS.reduce((largest, need) => (
    snapshot.needs[need.id] - settled.needs[need.id] > snapshot.needs[largest.id] - settled.needs[largest.id]
      ? need
      : largest
  ))
  const lowestNeed = NEEDS.reduce((lowest, need) => (
    settled.needs[need.id] < settled.needs[lowest.id] ? need : lowest
  ))
  const incidentId = settled.activeIncident?.id ?? null

  return {
    awayMinutes,
    changedNeed: changedNeed.id,
    needDrop: Math.max(0, Math.round(snapshot.needs[changedNeed.id] - settled.needs[changedNeed.id])),
    incidentId,
    recommendedAction: incidentId ? INCIDENT_BY_ID[incidentId].action : NEED_ACTION[lowestNeed.id],
  }
}

const formatAwayTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} MINUTES`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} HOURS`
  return `${Math.floor(minutes / (24 * 60))} DAYS`
}

const MOOD_COPY = {
  radiant: ['GLOWING', 'Mori is brighter than the morning.'],
  happy: ['CONTENT', 'A tiny, happy hum fills the room.'],
  peckish: ['PECKISH', 'Mori keeps glancing toward the snacks.'],
  sleepy: ['DROWSY', 'Those little eyelids are getting heavy.'],
  grumpy: ['FUSSY', 'Something feels a little out of tune.'],
  unwell: ['NEEDS CARE', 'Stay close. Mori needs gentle attention.'],
} as const

function Gauge({ label, glyph, value }: { label: string; glyph: string; value: number }) {
  const rounded = Math.round(value)
  return (
    <div className="gauge-row">
      <span className="gauge-glyph" aria-hidden="true">{glyph}</span>
      <span className="gauge-label">{label}</span>
      <div className="gauge-track" role="meter" aria-label={`${label} ${rounded}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded}>
        <span className="gauge-fill" style={{ width: `${rounded}%` }} />
      </div>
      <span className="gauge-value">{rounded}</span>
    </div>
  )
}

export default function App() {
  const game = useGameStore()
  const music = useNostalgiaMusic()
  const [tutorialOpen, setTutorialOpen] = useState(() => !isTutorialComplete())
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const [isIos] = useState(isIosDevice)
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [returnBrief, setReturnBrief] = useState<ReturnBrief | null>(() => createReturnBrief(game))
  const theme = THEME_BY_ID[game.themeId]
  const mood = getMood(game.needs)
  const moodCopy = MOOD_COPY[mood]
  const story = STORY_EVENTS[game.storyIndex]
  const storyUnlocked = isStoryUnlocked(game.storyIndex, game.bond)
  const storyRequirement = getStoryBondRequirement(game.storyIndex)
  const activeAction = isCareAction(game.lastAction) ? game.lastAction : null
  const actionFeedback = activeAction ? ACTION_FEEDBACK[activeAction] : null
  const personality = getDominantPersonality(game.personalityScores, game.personalityFocus)
  const growthStage = getGrowthStage(game.growthPoints)
  const incidentAction = game.activeIncident ? INCIDENT_BY_ID[game.activeIncident.id].action : null
  const returnAction = returnBrief ? ACTIONS.find((action) => action.id === returnBrief.recommendedAction) : null
  const returnNeed = returnBrief ? NEEDS.find((need) => need.id === returnBrief.changedNeed) : null
  const returnIncident = returnBrief?.incidentId ? INCIDENT_BY_ID[returnBrief.incidentId] : null
  const noticeLabel = game.lastAction === 'story'
    ? 'MEMORY SAVED'
    : game.lastAction === 'activity'
      ? 'ARCADE SIGNAL'
      : game.lastAction === 'workshop'
        ? 'WORKSHOP'
        : 'MORI’S SIGNAL'

  useLayoutEffect(() => {
    game.tick()
  }, [game.tick])

  useEffect(() => {
    const interval = window.setInterval(game.tick, 5_000)
    return () => window.clearInterval(interval)
  }, [game.tick])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const updateInstalledState = () => setIsInstalled(isStandaloneDisplay())
    const capture = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setIsInstalled(false)
    }
    const installed = () => {
      setInstallPrompt(null)
      setInstallGuideOpen(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', installed)
    displayMode.addEventListener('change', updateInstalledState)
    updateInstalledState()

    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', installed)
      displayMode.removeEventListener('change', updateInstalledState)
    }
  }, [])

  const themeStyle = useMemo(() => ({
    '--shell': theme.shell,
    '--shell-dark': theme.shellDark,
    '--accent': theme.accent,
    '--ink': theme.ink,
    '--screen': theme.screen,
    '--glow': theme.glow,
  }) as CSSProperties, [theme])

  const care = (action: CareAction) => {
    setReturnBrief(null)
    game.care(action)
    music.playSfx(action)
  }

  const finishTutorial = () => {
    saveTutorialCompletion()
    setTutorialOpen(false)
  }

  const install = async () => {
    if (isIos) {
      setInstallGuideOpen(true)
      return
    }

    if (installPrompt) {
      await installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
    }
  }

  const ageLabel = game.ageMinutes < 60
    ? `${Math.max(1, Math.floor(game.ageMinutes))} MIN`
    : `${Math.floor(game.ageMinutes / 60)} HR`

  return (
    <div className="app" style={themeStyle}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Tamagochi home">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>TAMA<br />GOCHI</span>
        </a>
        <div className="topbar-actions">
          <span className="save-status"><i /> LOCAL SAVE</span>
          {!isInstalled && (installPrompt || isIos) && (
            <button className="text-button install-button" onClick={() => void install()}>INSTALL APP</button>
          )}
          <button className="icon-button" onClick={() => setTutorialOpen(true)} aria-label="Open tutorial">?</button>
          <button className={`icon-button music-button ${music.isPlaying ? 'playing' : ''}`} onClick={() => void music.toggle()} aria-label={music.isPlaying ? 'Stop nostalgic music' : 'Play nostalgic music'} title={music.isPlaying ? 'Music on' : 'Play music'}>
            {music.isPlaying ? '♫' : '♪'}
          </button>
        </div>
      </header>

      {returnBrief && returnAction && returnNeed && (
        <section className="return-brief" aria-labelledby="return-brief-title" aria-live="polite">
          <span className="return-brief-mark" aria-hidden="true">↺</span>
          <div className="return-brief-copy">
            <p className="eyebrow">POCKET RETURN SIGNAL · AWAY {formatAwayTime(returnBrief.awayMinutes)}</p>
            <h2 id="return-brief-title">Welcome back. Mori kept the light on.</h2>
            <p>
              {returnIncident
                ? `${returnIncident.title} is waiting for your help.`
                : `${returnNeed.label} changed most${returnBrief.needDrop > 0 ? `, down ${returnBrief.needDrop} points` : ''}. Mori has a gentle next step ready.`}
            </p>
          </div>
          <div className="return-brief-actions">
            <button className="primary" onClick={() => care(returnBrief.recommendedAction)}>
              <span aria-hidden="true">{returnAction.icon}</span> CARE NOW · {returnAction.label.toUpperCase()}
            </button>
            <button onClick={() => setReturnBrief(null)}>NOT NOW</button>
          </div>
        </section>
      )}

      <main id="home" className="game-layout">
        <section className="hero-copy" aria-labelledby="pet-title">
          <p className="eyebrow">{growthStage.name.toUpperCase()} · {personality.toUpperCase()} SOUL</p>
          <h1 id="pet-title">Meet<br /><em>{game.petName}.</em></h1>
          <p className="hero-note">A tiny life that remembers how you care.</p>
        </section>

        <section className="device-stage" aria-label={`${game.petName}'s ${theme.name} device`}>
          <div className="device-shadow" />
          <div className="device">
            <div className="device-loop"><span /></div>
            <div className="device-label"><b>{theme.number}</b><span>{theme.name}</span><i>ONLINE</i></div>
            <div className="screen-bezel">
              <div className="screen-meta">
                <span>{moodCopy[0]}</span>
                <span>AGE {ageLabel}</span>
              </div>
              <div className="scene-wrap">
                <Suspense fallback={<div className="scene-loading">WAKING UP…</div>}>
                  <PetScene
                    theme={theme}
                    mood={mood}
                    lastAction={game.lastAction}
                    actionNonce={game.actionNonce}
                    reducedMotion={reducedMotion}
                    personality={personality}
                    growthStage={growthStage.id}
                    incidentId={game.activeIncident?.id ?? null}
                    wearableId={game.equippedWearable}
                    roomItemId={game.equippedRoomItem}
                    onPlay={() => care('play')}
                  />
                </Suspense>
                <button className="scene-play-button" onClick={() => care('play')}>PLAY WITH MORI</button>
                {activeAction && actionFeedback && (
                  <div key={`action-${game.actionNonce}`} className={`action-feedback action-feedback-${activeAction}`} role="status" aria-live="polite">
                    <i className="action-feedback-burst" aria-hidden="true" />
                    <span aria-hidden="true">{ACTIONS.find((action) => action.id === activeAction)?.icon}</span>
                    <strong>{actionFeedback.title}</strong>
                    <small>{actionFeedback.detail}</small>
                  </div>
                )}
                <div className="scanlines" aria-hidden="true" />
              </div>
              <div className="screen-caption">
                <strong>{game.petName}</strong>
                <span>{moodCopy[1]}</span>
              </div>
            </div>
            <div className="hardware-controls" aria-label="Quick care controls">
              {ACTIONS.slice(0, 3).map((action) => (
                <button key={action.id} onClick={() => care(action.id)} aria-label={action.label}>{action.icon}</button>
              ))}
            </div>
          </div>
        </section>

        <aside id="care-panel" className="care-panel" aria-label="Pet care panel">
          <div className="panel-heading">
            <div><p className="eyebrow">TODAY'S SIGNAL</p><h2>{moodCopy[0]}</h2></div>
            <span className={`mood-orb mood-${mood}`} aria-hidden="true" />
          </div>
          <div className="mode-switch" aria-label="Care difficulty">
            <button aria-pressed={game.mode === 'cozy'} className={game.mode === 'cozy' ? 'active' : ''} onClick={() => game.setMode('cozy')}>COZY</button>
            <button aria-pressed={game.mode === 'classic'} className={game.mode === 'classic' ? 'active' : ''} onClick={() => game.setMode('classic')}>CLASSIC</button>
          </div>
          <div className="gauges">
            {NEEDS.map((need) => <Gauge key={need.id} {...need} value={game.needs[need.id]} />)}
          </div>
          <div className="bond-line"><span>BOND</span><strong>{Math.round(game.bond)}%</strong></div>
          <div className="reward-strip" aria-label="Arcade progress">
            <span>✦ {game.sparks} SPARKS</span><span>↻ {game.playStreak} DAY</span>
          </div>
          <div className="care-actions">
            {ACTIONS.map((action) => {
              const rescuesMori = incidentAction === action.id
              return (
                <button
                  key={action.id}
                  className={rescuesMori ? 'rescue-action' : ''}
                  aria-label={`${action.label}${rescuesMori ? ', resolves Mori’s active incident' : ''}`}
                  onClick={() => care(action.id)}
                >
                  <span aria-hidden="true">{action.icon}</span><b>{action.label}</b><small>{rescuesMori ? 'RESCUE · TRY THIS' : action.hint}</small>
                </button>
              )
            })}
          </div>
          <button className="story-button" onClick={game.openStory} disabled={!storyUnlocked}>
            <span>{!story ? 'ALL MEMORIES FOUND' : storyUnlocked ? 'OPEN NEXT MEMORY' : `NEXT MEMORY AT ${storyRequirement}% BOND`}</span><b>→</b>
          </button>
        </aside>
      </main>

      {game.lastReply && !game.storyOpen && (
        <div className="reply-toast" role="status"><span>{noticeLabel}</span>{game.lastReply}</div>
      )}

      <GrowthStudio />
      <ActivityArcade />

      <section className="theme-section" aria-labelledby="theme-title">
        <div className="section-lead">
          <p className="eyebrow">DEVICE COLLECTION</p>
          <h2 id="theme-title">One friend.<br /><em>Many worlds.</em></h2>
          <p>Every shell changes the room inside—not just the color outside.</p>
        </div>
        <div className="theme-list">
          {THEMES.map((item) => (
            <button
              key={item.id}
              className={`theme-card ${item.id === theme.id ? 'selected' : ''}`}
              style={{ '--card-color': item.shell, '--card-accent': item.accent } as CSSProperties}
              onClick={() => game.setTheme(item.id)}
              aria-pressed={item.id === theme.id}
            >
              <span className="mini-device"><i /><b>◉‿◉</b></span>
              <span className="theme-copy"><small>{item.number}</small><strong>{item.name}</strong><em>{item.tagline}</em></span>
              <span className="select-dot" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <footer>
        <span>TAMAGOCHI · ORIGINAL VIRTUAL PET</span>
        <button onClick={() => { if (window.confirm('Start again with a fresh egg?')) game.reset() }}>RESET SAVE</button>
      </footer>

      {game.storyOpen && story && (
        <div className="story-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) game.closeStory() }}>
          <section className="story-dialog" role="dialog" aria-modal="true" aria-labelledby="story-title">
            <button className="dialog-close" onClick={game.closeStory} aria-label="Close story">×</button>
            <div className="story-art" aria-hidden="true"><span>✦</span><i /><b>◉‿◉</b></div>
            <div className="story-content">
              <p className="eyebrow">{story.eyebrow}</p>
              <h2 id="story-title">{story.title}</h2>
              <p>{story.body}</p>
              <div className="story-choices">
                {story.choices.map((choice, index) => (
                  <button key={choice.label} onClick={() => game.chooseStory(index)}><span>{choice.label}</span><b>→</b></button>
                ))}
              </div>
              <small>Your choices shape Mori's future evolution.</small>
            </div>
          </section>
        </div>
      )}

      {installGuideOpen && (
        <div className="install-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstallGuideOpen(false) }}>
          <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title">
            <button className="dialog-close" onClick={() => setInstallGuideOpen(false)} aria-label="Close installation guide">×</button>
            <div className="install-art" aria-hidden="true">
              <span className="install-device">◉‿◉</span>
              <i>↑</i>
            </div>
            <div className="install-copy">
              <p className="eyebrow">ADD TO YOUR HOME SCREEN</p>
              <h2 id="install-title">Keep Mori<br /><em>in your pocket.</em></h2>
              <ol className="install-steps">
                <li><b>1</b><span><strong>Tap Share</strong> in Safari's toolbar.</span></li>
                <li><b>2</b><span><strong>Choose Add to Home Screen</strong> from the share menu.</span></li>
                <li><b>3</b><span><strong>Tap Add</strong> to install Tamagochi.</span></li>
              </ol>
              <p className="install-note">Once installed, Tamagochi opens full-screen and keeps Mori available offline.</p>
              <button className="install-done" onClick={() => setInstallGuideOpen(false)}>GOT IT</button>
            </div>
          </section>
        </div>
      )}

      <FirstRunTutorial open={tutorialOpen} onFinish={finishTutorial} />
    </div>
  )
}