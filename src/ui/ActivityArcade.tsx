import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useGameStore } from '../game/store'
import type { MiniGameId } from '../game/types'

const ROUND_DURATION_MS = 12_000
const PADS = [
  { glyph: '●', label: 'Circle' },
  { glyph: '▲', label: 'Triangle' },
  { glyph: '■', label: 'Square' },
  { glyph: '✦', label: 'Star' },
] as const

function StarCatch({ onClose }: { onClose: () => void }) {
  const complete = useGameStore((state) => state.completeActivity)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(12)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const scoreRef = useRef(0)

  useEffect(() => {
    if (phase !== 'playing') return
    const deadline = Date.now() + ROUND_DURATION_MS
    let timer: number

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        complete('star-catch', scoreRef.current)
        setPhase('done')
        return
      }
      timer = window.setTimeout(updateTimer, 200)
    }

    updateTimer()
    return () => window.clearTimeout(timer)
  }, [complete, phase])

  const start = () => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(12)
    setPhase('playing')
  }
  const catchStar = () => {
    setScore((value) => {
      const nextScore = value + 1
      scoreRef.current = nextScore
      return nextScore
    })
    setPosition({ x: 10 + Math.random() * 80, y: 14 + Math.random() * 72 })
  }

  return (
    <GameShell title="Star Catch" subtitle="Catch as many falling memories as you can." onClose={onClose}>
      <div className="game-hud"><span>TIME <b>{timeLeft}</b></span><span>SCORE <b>{score}</b></span></div>
      <div className="star-field">
        {phase === 'ready' && <GamePrompt icon="★" title="Quick hands, bright heart." body="You have 12 seconds. Mouse, touch, and keyboard all work." action="START ROUND" onAction={start} />}
        {phase === 'playing' && <button className="catch-star" style={{ '--star-x': `${position.x}%`, '--star-y': `${position.y}%` } as CSSProperties} onClick={catchStar} aria-label="Catch star">★</button>}
        {phase === 'done' && <GamePrompt icon="✦" title={`${score} memories caught!`} body={`Mori earned ${Math.max(3, Math.floor(score / 2))} Sparks.`} action="PLAY AGAIN" onAction={start} />}
      </div>
    </GameShell>
  )
}

function MemoryFlip({ onClose }: { onClose: () => void }) {
  const complete = useGameStore((state) => state.completeActivity)
  const [phase, setPhase] = useState<'ready' | 'preview' | 'input' | 'done'>('ready')
  const [sequence, setSequence] = useState<number[]>([])
  const [picks, setPicks] = useState<number[]>([])
  const [won, setWon] = useState(false)

  useEffect(() => {
    if (phase !== 'preview') return
    const timer = window.setTimeout(() => setPhase('input'), 2_700)
    return () => window.clearTimeout(timer)
  }, [phase])

  const start = () => {
    setSequence(Array.from({ length: 5 }, () => Math.floor(Math.random() * PADS.length)))
    setPicks([])
    setWon(false)
    setPhase('preview')
  }

  const pick = (value: number) => {
    if (phase !== 'input') return
    const nextPicks = [...picks, value]
    setPicks(nextPicks)
    if (sequence[picks.length] !== value) {
      complete('memory-flip', picks.length * 3)
      setWon(false)
      setPhase('done')
    } else if (nextPicks.length === sequence.length) {
      complete('memory-flip', 20)
      setWon(true)
      setPhase('done')
    }
  }

  const resultPrompt = won
    ? {
        icon: '♥',
        title: 'Perfect signal!',
        body: 'A clear memory—and 10 bonus Sparks.',
      }
    : {
        icon: '◇',
        title: `${picks.length} symbols remembered`,
        body: 'The signal faded, but Mori loved trying with you.',
      }

  return (
    <GameShell title="Signal Memory" subtitle="Remember Mori’s five-symbol secret signal." onClose={onClose}>
      <div className="memory-board">
        {phase === 'ready' && <GamePrompt icon="◆" title="Watch. Remember. Repeat." body="The signal is visible for just a moment." action="SHOW SIGNAL" onAction={start} />}
        {phase === 'preview' && (
          <div className="signal-preview" aria-label={`Signal: ${sequence.map((value) => PADS[value].label).join(', ')}`}>
            {sequence.map((value, index) => <span key={index} aria-hidden="true">{PADS[value].glyph}</span>)}
          </div>
        )}
        {phase === 'input' && (
          <div className="signal-input">
            <p aria-label={picks.length ? `Your signal: ${picks.map((value) => PADS[value].label).join(', ')}` : 'Your signal is empty'}>
              {picks.map((value) => PADS[value].glyph).join('  ') || 'YOUR SIGNAL…'}
            </p>
            <div>
              {PADS.map((pad, index) => (
                <button key={pad.label} aria-label={`Choose ${pad.label}`} onClick={() => pick(index)}>
                  {pad.glyph}
                </button>
              ))}
            </div>
          </div>
        )}
        {phase === 'done' && (
          <GamePrompt
            icon={resultPrompt.icon}
            title={resultPrompt.title}
            body={resultPrompt.body}
            action="TRY AGAIN"
            onAction={start}
          />
        )}
      </div>
    </GameShell>
  )
}

function GamePrompt({ icon, title, body, action, onAction }: { icon: string; title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="game-prompt">
      <i aria-hidden="true">{icon}</i><h3>{title}</h3><p>{body}</p><button onClick={onAction}>{action} →</button>
    </div>
  )
}

function GameShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    closeButtonRef.current?.focus()
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="game-overlay" role="presentation">
      <section className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title">
        <header><div><p className="eyebrow">TAMAGOCHI ARCADE</p><h2 id="game-title">{title}</h2><span>{subtitle}</span></div><button ref={closeButtonRef} onClick={onClose} aria-label="Close game">×</button></header>
        {children}
      </section>
    </div>
  )
}

export function ActivityArcade() {
  const [activeGame, setActiveGame] = useState<MiniGameId | null>(null)
  const sparks = useGameStore((state) => state.sparks)
  const streak = useGameStore((state) => state.playStreak)
  const best = useGameStore((state) => state.activityBest)

  return (
    <section className="activity-section" aria-labelledby="activity-title">
      <div className="activity-heading">
        <div><p className="eyebrow">TAMAGOCHI ARCADE · OPEN DAILY</p><h2 id="activity-title">Tiny games.<br /><em>Real rituals.</em></h2></div>
        <div className="reward-counter"><span>✦ {sparks} SPARKS</span><span>↻ {streak} DAY STREAK</span></div>
      </div>
      <div className="activity-grid">
        <button className="activity-card star-card" onClick={() => setActiveGame('star-catch')}>
          <span className="activity-art">★<i>✦</i><b>·</b></span>
          <span><small>REACTION · 12 SEC</small><strong>Star Catch</strong><em>Best score {best['star-catch']}</em></span><b>PLAY →</b>
        </button>
        <button className="activity-card memory-card" onClick={() => setActiveGame('memory-flip')}>
          <span className="activity-art">◆<i>●</i><b>▲</b></span>
          <span><small>MEMORY · 1 MIN</small><strong>Signal Memory</strong><em>Best score {best['memory-flip']}</em></span><b>PLAY →</b>
        </button>
      </div>
      {activeGame === 'star-catch' && <StarCatch onClose={() => setActiveGame(null)} />}
      {activeGame === 'memory-flip' && <MemoryFlip onClose={() => setActiveGame(null)} />}
    </section>
  )
}