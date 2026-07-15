import { useEffect, useState, type CSSProperties } from 'react'
import { useGameStore } from '../game/store'
import type { MiniGameId } from '../game/types'

const PADS = ['●', '▲', '■', '✦'] as const

function StarCatch({ onClose }: { onClose: () => void }) {
  const complete = useGameStore((state) => state.completeActivity)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(12)
  const [position, setPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      complete('star-catch', score)
      setPhase('done')
      return
    }
    const timer = window.setTimeout(() => setTimeLeft((time) => time - 1), 1_000)
    return () => window.clearTimeout(timer)
  }, [complete, phase, score, timeLeft])

  const start = () => { setScore(0); setTimeLeft(12); setPhase('playing') }
  const catchStar = () => {
    setScore((value) => value + 1)
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

  return (
    <GameShell title="Signal Memory" subtitle="Remember Mori’s five-symbol secret signal." onClose={onClose}>
      <div className="memory-board">
        {phase === 'ready' && <GamePrompt icon="◆" title="Watch. Remember. Repeat." body="The signal is visible for just a moment." action="SHOW SIGNAL" onAction={start} />}
        {phase === 'preview' && <div className="signal-preview" aria-live="polite">{sequence.map((value, index) => <span key={index}>{PADS[value]}</span>)}</div>}
        {phase === 'input' && (
          <div className="signal-input">
            <p>{picks.map((value) => PADS[value]).join('  ') || 'YOUR SIGNAL…'}</p>
            <div>{PADS.map((pad, index) => <button key={pad} onClick={() => pick(index)}>{pad}</button>)}</div>
          </div>
        )}
        {phase === 'done' && <GamePrompt icon={won ? '♥' : '◇'} title={won ? 'Perfect signal!' : `${picks.length} symbols remembered`} body={won ? 'A clear memory—and 10 bonus Sparks.' : 'The signal faded, but Mori loved trying with you.'} action="TRY AGAIN" onAction={start} />}
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
  return (
    <div className="game-overlay" role="presentation">
      <section className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title">
        <header><div><p className="eyebrow">POKET ARCADE</p><h2 id="game-title">{title}</h2><span>{subtitle}</span></div><button onClick={onClose} aria-label="Close game">×</button></header>
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
        <div><p className="eyebrow">POKET ARCADE · OPEN DAILY</p><h2 id="activity-title">Tiny games.<br /><em>Real rituals.</em></h2></div>
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