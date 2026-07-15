import { useCallback, useEffect, useState } from 'react'
import type { CareAction } from '../game/types'

// Original pocket-console melody composed for Poket Worlds.
const MELODY = [
  523.25, 659.25, 783.99, 0, 659.25, 587.33, 523.25, 392,
  440, 523.25, 659.25, 0, 783.99, 659.25, 587.33, 440,
  523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 0,
  392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392,
] as const
const BASS = [130.81, 110, 146.83, 98] as const

class ChiptunePlayer {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private timer: number | null = null
  private step = 0

  get isPlaying() {
    return this.timer !== null
  }

  private async ensureContext() {
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.72
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
    return this.context
  }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.context || !this.master || frequency <= 0) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain).connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  private tick = () => {
    const note = MELODY[this.step % MELODY.length]
    if (note) this.tone(note, 0.13, 'square', 0.032)
    if (this.step % 4 === 0) {
      const bass = BASS[Math.floor(this.step / 8) % BASS.length]
      this.tone(bass, 0.24, 'triangle', 0.035)
    }
    this.step += 1
  }

  async start() {
    await this.ensureContext()
    if (this.timer !== null) return
    this.step = 0
    this.tick()
    this.timer = window.setInterval(this.tick, 155)
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  async playSfx(action: CareAction) {
    await this.ensureContext()
    const frequencies: Record<CareAction, number> = {
      feed: 330, play: 523.25, wash: 440, rest: 261.63, cuddle: 659.25, explore: 783.99,
    }
    this.tone(frequencies[action], 0.2, action === 'explore' ? 'square' : 'sine', 0.075)
    window.setTimeout(() => this.tone(frequencies[action] * 1.25, 0.16, 'sine', 0.05), 85)
  }

  dispose() {
    this.stop()
    if (this.context && this.context.state !== 'closed') void this.context.close()
    this.context = null
    this.master = null
  }
}

const player = new ChiptunePlayer()

export function useNostalgiaMusic() {
  const [isPlaying, setIsPlaying] = useState(false)

  const toggle = useCallback(async () => {
    if (player.isPlaying) {
      player.stop()
      setIsPlaying(false)
      return
    }
    await player.start()
    setIsPlaying(true)
  }, [])

  const playSfx = useCallback((action: CareAction) => {
    void player.playSfx(action)
  }, [])

  useEffect(() => () => player.dispose(), [])

  return { isPlaying, toggle, playSfx }
}