import { useState } from 'react'

const STEPS = [
  {
    number: '01', icon: '◉‿◉', eyebrow: 'MEET YOUR POCKET PAL',
    title: 'This is Mori. Start with a hello.',
    body: 'Mori reacts to your care, remembers story choices, and grows differently based on the life you share.',
    tip: 'Tap Mori inside the screen anytime for a quick play session.',
  },
  {
    number: '02', icon: '♥', eyebrow: 'READ THE SIGNALS',
    title: 'Five little meters tell the whole story.',
    body: 'Full, Joy, Clean, Rest, and Health drift over real time. Low signals change Mori’s mood and animation.',
    tip: 'Cozy mode is forgiving. Classic mode keeps the old-school consequences.',
  },
  {
    number: '03', icon: '● ✦ ≈ ☾', eyebrow: 'CARE & CONNECT',
    title: 'Every action shapes a different day.',
    body: 'Feed, play, wash, rest, cuddle, or explore. Actions trade one need for another, so follow Mori’s signals.',
    tip: 'Stories unlock as your bond grows. Your answers influence future evolution.',
  },
  {
    number: '04', icon: '★', eyebrow: 'MAKE IT A RITUAL',
    title: 'Play, collect Sparks, return tomorrow.',
    body: 'Mini-games raise Joy and Bond. Build a daily streak, chase your best score, and switch shells to enter new worlds.',
    tip: 'Press the music note for an original looping pocket-console tune.',
  },
] as const

interface TutorialProps {
  open: boolean
  onFinish: () => void
}

export function FirstRunTutorial({ open, onFinish }: TutorialProps) {
  const [step, setStep] = useState(0)
  if (!open) return null
  const card = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="tutorial-overlay" role="presentation">
      <section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <div className="tutorial-visual" aria-hidden="true">
          <span className="tutorial-number">{card.number}</span>
          <i>{card.icon}</i>
          <div className="tutorial-device"><b>◉‿◉</b></div>
        </div>
        <div className="tutorial-copy">
          <button className="tutorial-skip" onClick={onFinish}>SKIP TOUR</button>
          <p className="eyebrow">{card.eyebrow}</p>
          <h2 id="tutorial-title">{card.title}</h2>
          <p>{card.body}</p>
          <div className="tutorial-tip"><span>TIP</span>{card.tip}</div>
          <div className="tutorial-footer">
            <div className="tutorial-dots" aria-label={`Tutorial step ${step + 1} of ${STEPS.length}`}>
              {STEPS.map((item, index) => <i key={item.number} className={index === step ? 'active' : ''} />)}
            </div>
            <div className="tutorial-nav">
              {step > 0 && <button onClick={() => setStep((value) => value - 1)}>BACK</button>}
              <button className="primary" onClick={() => isLast ? onFinish() : setStep((value) => value + 1)}>
                {isLast ? 'ENTER MY WORLD' : 'NEXT'} <b>→</b>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}