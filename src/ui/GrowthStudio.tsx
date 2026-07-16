import {
  INCIDENT_BY_ID,
  KEEPSAKES,
  PERSONALITIES,
  getDominantPersonality,
  getGrowthProgress,
} from '../game/progression'
import { useGameStore } from '../game/store'
import type { KeepsakeId, PersonalityId } from '../game/types'

const TRAIT_COPY: Record<PersonalityId, string> = {
  gentle: 'Warm rituals and close care',
  playful: 'Games, movement, and surprise',
  curious: 'Discovery and thoughtful habits',
}

const titleCase = (value: string) => `${value[0].toUpperCase()}${value.slice(1)}`

export const GrowthStudio = () => {
  const game = useGameStore()
  const personalityId = getDominantPersonality(game.personalityScores, game.personalityFocus)
  const personality = PERSONALITIES.find(({ id }) => id === personalityId) ?? PERSONALITIES[0]
  const growth = getGrowthProgress(game.growthPoints)
  const incident = game.activeIncident ? INCIDENT_BY_ID[game.activeIncident.id] : null
  const traitMaximum = Math.max(10, ...Object.values(game.personalityScores))
  const growthReady = Date.now() >= game.growthCooldownUntil

  const itemState = (itemId: KeepsakeId) => {
    const owned = game.ownedItemIds.includes(itemId)
    const equipped = game.equippedWearable === itemId || game.equippedRoomItem === itemId
    return { owned, equipped }
  }

  return (
    <section className="growth-section" aria-labelledby="growth-title">
      <div className="growth-heading">
        <div>
          <p className="eyebrow">LIVING EVOLUTION · LOCAL & PRIVATE</p>
          <h2 id="growth-title">Mori’s Growth<br /><em>Studio.</em></h2>
        </div>
        <p>Every personality is a good path. Recent care gently changes which part of Mori shines brightest.</p>
      </div>

      <div className="growth-dashboard">
        <article className="identity-card">
          <div className="identity-mark" aria-hidden="true">{personality.glyph}</div>
          <div>
            <p className="eyebrow">CURRENT FORM</p>
            <h3>{growth.stage.name} · {personality.name}</h3>
            <p>{personality.description}</p>
          </div>
          <div className={`imprint-status ${growthReady ? 'ready' : ''}`}>
            <b>{growthReady ? 'CARE IMPRINT READY' : 'CARE IMPRINT RESTING'}</b>
            <span>{growthReady ? 'Your next care action can shape growth.' : 'Care still helps Mori while the next imprint gathers.'}</span>
          </div>
          <div className="growth-meter-block">
            <div className="meter-label">
              <span>{growth.stage.name}{growth.stage.nextAt ? ` → ${growth.stage.id === 'seedling' ? 'Bloom' : 'Luminary'}` : ' · COMPLETE'}</span>
              <strong>{growth.stage.nextAt ? `${growth.remaining} TO GO` : 'FULL GLOW'}</strong>
            </div>
            <div className="growth-track" role="meter" aria-label={`${growth.stage.name} growth progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(growth.percent)}>
              <span style={{ width: `${growth.percent}%` }} />
            </div>
          </div>
          <div className="trait-list" aria-label="Mori's personality traits">
            {PERSONALITIES.map((trait) => {
              const value = game.personalityScores[trait.id]
              return (
                <div className="trait-row" key={trait.id}>
                  <span aria-hidden="true">{trait.glyph}</span>
                  <div><b>{trait.name}</b><small>{TRAIT_COPY[trait.id]}</small></div>
                  <div className="trait-track" role="meter" aria-label={`${trait.name} trait ${Math.round(value)}`} aria-valuemin={1} aria-valuemax={traitMaximum} aria-valuenow={Math.round(value)}>
                    <span style={{ width: `${value / traitMaximum * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="migration-note">Your Bond, memories, and Sparks stay safe. This personality path begins from a fair shared starting point.</p>
        </article>

        <div className="studio-side">
          {incident && (
            <article className={`incident-card incident-${game.mode}`} role="status" aria-live="polite">
              <span className="incident-glyph" aria-hidden="true">{incident.glyph}</span>
              <div>
                <p className="eyebrow">POCKET INCIDENT · NEEDS YOU</p>
                <h3>{incident.title}</h3>
                <p>{incident.story}</p>
                <strong>Try {titleCase(incident.action)}.</strong>
                <small>{game.mode === 'cozy' ? 'Cozy mode: Mori is safe, and the incident will wait.' : 'Classic mode: Mori’s health slowly fades until you help.'}</small>
              </div>
              <a href="#care-panel">GO TO CARE ↑</a>
            </article>
          )}

          <article className="workshop-card">
            <div className="workshop-heading">
              <div><p className="eyebrow">SPARK WORKSHOP</p><h3>Earned keepsakes.</h3></div>
              <strong>✦ {game.sparks}</strong>
            </div>
            <p className="workshop-note">Device themes stay free. Arcade Sparks unlock optional keepsakes for Mori and the room.</p>
            <div className="keepsake-grid">
              {KEEPSAKES.map((item) => {
                const { owned, equipped } = itemState(item.id)
                const shortfall = Math.max(0, item.cost - game.sparks)
                return (
                  <article className={`keepsake-card ${equipped ? 'equipped' : ''}`} key={item.id}>
                    <span className="keepsake-glyph" aria-hidden="true">{item.glyph}</span>
                    <div className="keepsake-copy">
                      <small>{item.category.toUpperCase()} · {item.cost} SPARKS</small>
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                    </div>
                    {!owned ? (
                      <div className="keepsake-action">
                        <button disabled={shortfall > 0} onClick={() => game.purchaseKeepsake(item.id)}>UNLOCK · {item.cost}</button>
                        {shortfall > 0 && <span>Need {shortfall} more Sparks</span>}
                      </div>
                    ) : (
                      <button
                        className="equip-button"
                        aria-pressed={equipped}
                        aria-label={`${item.name} is ${equipped ? 'equipped; remove it' : 'owned; equip it'}`}
                        onClick={() => game.toggleKeepsake(item.id)}
                      >
                        {equipped ? 'EQUIPPED · REMOVE' : 'OWNED · EQUIP'}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
