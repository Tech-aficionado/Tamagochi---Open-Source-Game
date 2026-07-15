import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { CareAction, PetMood, ThemeDefinition } from '../game/types'

type ActionSignal = CareAction | 'story' | 'activity' | null

const CARE_ACTIONS = new Set<CareAction>(['feed', 'play', 'wash', 'rest', 'cuddle', 'explore'])
const ACTION_DURATION: Record<CareAction, number> = {
  feed: 1.45,
  play: 1.6,
  wash: 1.55,
  rest: 2.2,
  cuddle: 1.9,
  explore: 1.8,
}

function isCareAction(action: ActionSignal): action is CareAction {
  return action !== null && CARE_ACTIONS.has(action as CareAction)
}

function Heart({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, 0, Math.PI]}>
      <mesh position={[-0.09, 0, 0]}><sphereGeometry args={[0.13, 12, 10]} /><meshBasicMaterial color="#ff7897" /></mesh>
      <mesh position={[0.09, 0, 0]}><sphereGeometry args={[0.13, 12, 10]} /><meshBasicMaterial color="#ff7897" /></mesh>
      <mesh position={[0, 0.12, 0]}><coneGeometry args={[0.2, 0.34, 4]} /><meshBasicMaterial color="#ff7897" /></mesh>
    </group>
  )
}

function ActionEffects({ action, color, reducedMotion }: { action: CareAction; color: string; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    if (!group.current) return
    elapsed.current += delta
    const duration = ACTION_DURATION[action]
    const progress = Math.min(1, elapsed.current / duration)
    const envelope = Math.sin(progress * Math.PI)
    group.current.position.y = reducedMotion ? 0 : progress * 0.45
    group.current.rotation.y = reducedMotion ? 0 : progress * Math.PI * 1.2
    group.current.scale.setScalar(0.8 + envelope * 0.3)
  })

  const bubblePositions: [number, number, number][] = [[-0.7, 0.2, 0.6], [-0.45, 0.9, 0.4], [0.62, 0.45, 0.6], [0.4, 1.1, 0.2], [0, 1.35, 0.1]]
  const starPositions: [number, number, number][] = [[-0.9, 0.9, 0.4], [0.9, 0.7, 0.2], [-0.55, 1.45, 0], [0.45, 1.55, 0.2]]

  return (
    <group ref={group} position={[0, 0, 0.5]}>
      {action === 'feed' && (
        <group>
          <mesh position={[0.52, 0.14, 0.7]}><sphereGeometry args={[0.18, 14, 10]} /><meshStandardMaterial color="#e68a45" /></mesh>
          {[-0.24, 0, 0.25].map((x, index) => <mesh key={x} position={[x, 0.46 + index * 0.1, 0.82]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#fff1a8" /></mesh>)}
        </group>
      )}
      {action === 'play' && starPositions.map((position, index) => (
        <mesh key={index} position={position} rotation={[0.4, 0.3, index]}><octahedronGeometry args={[0.16]} /><meshStandardMaterial color={index % 2 ? color : '#fff4a8'} emissive={color} emissiveIntensity={0.3} /></mesh>
      ))}
      {action === 'wash' && bubblePositions.map((position, index) => (
        <mesh key={index} position={position}><sphereGeometry args={[0.11 + index * 0.018, 14, 10]} /><meshPhysicalMaterial color="#bff7ff" transparent opacity={0.58} roughness={0.08} transmission={0.25} /></mesh>
      ))}
      {action === 'rest' && (
        <group position={[0.75, 1.25, 0.2]}>
          <mesh rotation={[0, 0, 0.5]}><torusGeometry args={[0.3, 0.065, 10, 24, Math.PI * 1.45]} /><meshBasicMaterial color="#fff0a8" /></mesh>
          <mesh position={[-0.55, 0.15, 0]}><sphereGeometry args={[0.055, 8, 6]} /><meshBasicMaterial color="#fff" /></mesh>
        </group>
      )}
      {action === 'cuddle' && (
        <group><Heart position={[-0.72, 0.75, 0.4]} /><Heart position={[0.66, 1.1, 0.2]} scale={0.78} /><Heart position={[0, 1.55, 0]} scale={0.62} /></group>
      )}
      {action === 'explore' && (
        <group position={[0, 0.85, 0.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.75, 0.035, 8, 38]} /><meshBasicMaterial color={color} /></mesh>
          {[0, 1, 2, 3].map((index) => <mesh key={index} position={[Math.cos(index * Math.PI / 2) * 0.75, Math.sin(index * Math.PI / 2) * 0.75, 0]} rotation={[0, 0, -index * Math.PI / 2]}><coneGeometry args={[0.1, 0.28, 4]} /><meshBasicMaterial color="#fff4a8" /></mesh>)}
        </group>
      )}
    </group>
  )
}


interface PetProps {
  mood: PetMood
  accent: string
  effectColor: string
  lastAction: ActionSignal
  actionNonce: number
  reducedMotion: boolean
  onPlay: () => void
}

function Pet({ mood, accent, effectColor, lastAction, actionNonce, reducedMotion, onPlay }: PetProps) {
  const group = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Mesh>(null)
  const rightEye = useRef<THREE.Mesh>(null)
  const actionElapsed = useRef(10)
  const pulse = useRef(0)
  const [activeAction, setActiveAction] = useState<CareAction | null>(null)

  useEffect(() => {
    pulse.current = 1
    if (!isCareAction(lastAction)) {
      setActiveAction(null)
      return
    }
    actionElapsed.current = 0
    setActiveAction(lastAction)
    const timer = window.setTimeout(() => setActiveAction(null), ACTION_DURATION[lastAction] * 1_000)
    return () => window.clearTimeout(timer)
  }, [actionNonce, lastAction])

  useFrame((state, delta) => {
    if (!group.current) return
    const time = state.clock.elapsedTime
    actionElapsed.current += delta
    pulse.current = Math.max(0, pulse.current - delta * 1.8)

    const duration = activeAction ? ACTION_DURATION[activeAction] : 1
    const progress = Math.min(1, actionElapsed.current / duration)
    const envelope = activeAction ? Math.sin(progress * Math.PI) : 0
    const motion = reducedMotion ? 0.18 : 1
    const idleY = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.065
    const idleTilt = reducedMotion ? 0 : Math.sin(time * 1.4) * 0.03
    let x = 0
    let y = idleY
    let rotateX = 0
    let rotateY = 0
    let rotateZ = idleTilt
    let scaleX = 1
    let scaleY = 1 + (reducedMotion ? 0 : Math.sin(time * 2) * 0.012)
    let scaleZ = 1

    if (activeAction === 'feed') {
      rotateX = Math.sin(progress * Math.PI * 6) * 0.12 * envelope * motion
      scaleX += envelope * 0.04
      scaleY -= envelope * 0.05
    } else if (activeAction === 'play') {
      y += Math.abs(Math.sin(progress * Math.PI * 4)) * 0.38 * envelope * motion
      rotateY = Math.sin(progress * Math.PI * 2) * 0.72 * envelope * motion
      scaleX += envelope * 0.08
      scaleY += envelope * 0.08
    } else if (activeAction === 'wash') {
      rotateZ += Math.sin(progress * Math.PI * 12) * 0.2 * envelope * motion
      x = Math.sin(progress * Math.PI * 12) * 0.08 * envelope * motion
    } else if (activeAction === 'rest') {
      y -= envelope * 0.2 * motion
      rotateZ -= envelope * 0.08 * motion
      scaleX += envelope * 0.07
      scaleY -= envelope * 0.1
    } else if (activeAction === 'cuddle') {
      x -= envelope * 0.18 * motion
      rotateZ -= envelope * 0.2 * motion
      scaleX += envelope * 0.15
      scaleY -= envelope * 0.12
      scaleZ += envelope * 0.08
    } else if (activeAction === 'explore') {
      x = Math.sin(progress * Math.PI * 4) * 0.26 * envelope * motion
      y += Math.abs(Math.sin(progress * Math.PI * 4)) * 0.14 * envelope * motion
      rotateY = Math.sin(progress * Math.PI * 3) * 0.32 * envelope * motion
      rotateZ += Math.sin(progress * Math.PI * 4) * 0.08 * envelope * motion
    } else {
      const bounce = Math.sin((1 - pulse.current) * Math.PI) * pulse.current * 0.12
      scaleX += bounce
      scaleY += bounce
      scaleZ += bounce
    }

    group.current.position.set(x, y, 0.4)
    group.current.rotation.set(rotateX, rotateY, rotateZ)
    group.current.scale.set(scaleX, scaleY, scaleZ)

    const restingEye = mood === 'sleepy' || mood === 'unwell' ? 0.12 : mood === 'grumpy' ? 0.72 : mood === 'radiant' ? 1.16 : 1
    const blink = !activeAction && restingEye > 0.2 && Math.sin(time * 0.82) > 0.975 ? 0.08 : restingEye
    let eyeTarget = blink
    if (activeAction === 'rest' || activeAction === 'cuddle') eyeTarget = 0.12
    else if (activeAction === 'feed') eyeTarget = 0.42
    else if (activeAction === 'wash') eyeTarget = 0.15 + Math.abs(Math.sin(progress * Math.PI * 8)) * 0.55
    else if (activeAction === 'play' || activeAction === 'explore') eyeTarget = 1.24
    if (leftEye.current && rightEye.current) {
      leftEye.current.scale.y = THREE.MathUtils.lerp(leftEye.current.scale.y, eyeTarget, 0.25)
      rightEye.current.scale.y = THREE.MathUtils.lerp(rightEye.current.scale.y, eyeTarget, 0.25)
    }
  })

  const closedHappy = activeAction === 'cuddle' || activeAction === 'rest'
  const openMouth = activeAction === 'feed' || activeAction === 'rest' || activeAction === 'explore'
  const smiling = activeAction === 'play' || activeAction === 'cuddle' || (!activeAction && (mood === 'happy' || mood === 'radiant'))
  const frowning = !activeAction && (mood === 'grumpy' || mood === 'unwell')
  const cheekOpacity = activeAction === 'cuddle' ? 0.9 : mood === 'radiant' || activeAction === 'play' ? 0.72 : 0.48

  return (
    <group
      ref={group}
      position={[0, 0, 0.4]}
      onClick={(event) => { event.stopPropagation(); onPlay() }}
      onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
      onPointerLeave={() => { document.body.style.cursor = 'default' }}
    >
      <mesh castShadow position={[-0.48, 0.76, -0.02]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.28, 0.7, 5]} />
        <meshStandardMaterial color={accent} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0.48, 0.76, -0.02]} rotation={[0, 0, 0.35]}>
        <coneGeometry args={[0.28, 0.7, 5]} />
        <meshStandardMaterial color={accent} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]} scale={[1, 1.08, 0.85]}>
        <sphereGeometry args={[0.82, 32, 24]} />
        <meshStandardMaterial color={accent} roughness={0.67} />
      </mesh>
      <mesh castShadow position={[-0.48, -0.62, 0.08]} scale={[1.2, 0.65, 1.2]}>
        <sphereGeometry args={[0.28, 20, 16]} /><meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.48, -0.62, 0.08]} scale={[1.2, 0.65, 1.2]}>
        <sphereGeometry args={[0.28, 20, 16]} /><meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>

      <mesh ref={leftEye} position={[-0.27, 0.25, 0.7]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.105, 16, 12]} /><meshStandardMaterial color="#211a2a" roughness={0.25} />
      </mesh>
      <mesh ref={rightEye} position={[0.27, 0.25, 0.7]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.105, 16, 12]} /><meshStandardMaterial color="#211a2a" roughness={0.25} />
      </mesh>
      {!closedHappy && (
        <>
          <mesh position={[-0.295, 0.29, 0.76]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[0.245, 0.29, 0.76]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
        </>
      )}
      {(mood === 'grumpy' && !activeAction) && (
        <>
          <mesh position={[-0.27, 0.49, 0.72]} rotation={[0, 0, -0.22]}><boxGeometry args={[0.25, 0.035, 0.035]} /><meshBasicMaterial color="#4c2933" /></mesh>
          <mesh position={[0.27, 0.49, 0.72]} rotation={[0, 0, 0.22]}><boxGeometry args={[0.25, 0.035, 0.035]} /><meshBasicMaterial color="#4c2933" /></mesh>
        </>
      )}
      {openMouth ? (
        <mesh position={[0, activeAction === 'rest' ? -0.02 : 0.03, 0.765]} scale={activeAction === 'rest' ? [1, 1.25, 0.45] : [1, 0.85, 0.45]}>
          <sphereGeometry args={[activeAction === 'rest' ? 0.13 : 0.095, 14, 10]} /><meshBasicMaterial color="#4c2933" />
        </mesh>
      ) : (
        <mesh position={[0, 0.01, 0.76]} rotation={[0, 0, frowning ? Math.PI : 0]} scale={[smiling ? 1.25 : 1, 1, 1]}>
          <torusGeometry args={[0.105, 0.022, 8, 18, Math.PI]} /><meshBasicMaterial color="#4c2933" />
        </mesh>
      )}
      <mesh position={[-0.49, 0.04, 0.65]} scale={[1.4, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 12, 10]} /><meshBasicMaterial color="#ef7f89" transparent opacity={cheekOpacity} />
      </mesh>
      <mesh position={[0.49, 0.04, 0.65]} scale={[1.4, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 12, 10]} /><meshBasicMaterial color="#ef7f89" transparent opacity={cheekOpacity} />
      </mesh>
      {activeAction && <ActionEffects key={`${activeAction}-${actionNonce}`} action={activeAction} color={effectColor} reducedMotion={reducedMotion} />}
    </group>
  )
}


function ThemeDecor({ theme }: { theme: ThemeDefinition }) {
  if (theme.id === 'cyber') {
    return (
      <group position={[0, -0.7, -1.25]}>
        {[-2.2, -1.45, 1.45, 2.2].map((x, index) => (
          <RoundedBox key={x} args={[0.38, 1 + index % 2 * 0.45, 0.35]} radius={0.06} position={[x, 0, 0]}>
            <meshStandardMaterial color={theme.shellDark} emissive={theme.glow} emissiveIntensity={0.55} />
          </RoundedBox>
        ))}
      </group>
    )
  }
  if (theme.id === 'moss') {
    return (
      <group position={[0, -0.78, -1]}>
        {[-2, -1.45, 1.55, 2.1].map((x, index) => (
          <group key={x} position={[x, 0, index % 2 * 0.2]} scale={0.7 + index * 0.08}>
            <mesh castShadow><cylinderGeometry args={[0.08, 0.12, 0.55, 8]} /><meshStandardMaterial color="#f2dfb5" /></mesh>
            <mesh castShadow position={[0, 0.3, 0]}><sphereGeometry args={[0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={index % 2 ? '#d6755f' : theme.accent} /></mesh>
          </group>
        ))}
      </group>
    )
  }
  if (theme.id === 'moon') {
    return (
      <group position={[1.9, 1.1, -1.4]}>
        <mesh><sphereGeometry args={[0.62, 24, 18]} /><meshStandardMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={0.35} roughness={0.9} /></mesh>
        <mesh rotation={[Math.PI / 2.8, 0.2, 0]}><torusGeometry args={[0.85, 0.06, 10, 36]} /><meshStandardMaterial color={theme.accent} /></mesh>
      </group>
    )
  }
  return (
    <group position={[-1.9, -0.5, -1.2]}>
      <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.13, 0.2, 1.5, 8]} /><meshStandardMaterial color="#6e4d3c" /></mesh>
      {[[0, 1.35], [-0.45, 1.05], [0.42, 1.05], [-0.22, 1.62], [0.28, 1.58]].map(([x, y], index) => (
        <mesh castShadow key={index} position={[x, y, 0]}><sphereGeometry args={[0.37, 14, 10]} /><meshStandardMaterial color={index % 2 ? '#ff9ca4' : '#ffc5bd'} /></mesh>
      ))}
    </group>
  )
}

interface WorldProps {
  theme: ThemeDefinition
  mood: PetMood
  lastAction: ActionSignal
  actionNonce: number
  reducedMotion: boolean
  onPlay: () => void
}

function World({ theme, mood, lastAction, actionNonce, reducedMotion, onPlay }: WorldProps) {
  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, 8, 16]} />
      <hemisphereLight args={[theme.glow, theme.ground, 1.8]} />
      <directionalLight castShadow position={[3, 6, 4]} intensity={2.2} color={theme.glow} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 1.8, 2]} intensity={12} distance={7} color={theme.particle} />
      <mesh receiveShadow position={[0, -1.05, -0.1]}>
        <cylinderGeometry args={[3.8, 3.35, 0.38, 48]} />
        <meshStandardMaterial color={theme.ground} roughness={0.86} />
      </mesh>
      <RoundedBox args={[6.8, 4.1, 0.28]} radius={0.5} position={[0, 0.45, -2.1]}>
        <meshStandardMaterial color={theme.screen} roughness={0.9} />
      </RoundedBox>
      <ThemeDecor theme={theme} />
      <Float speed={reducedMotion ? 0 : 1.5} rotationIntensity={0.08} floatIntensity={0.12}>
        <Pet
          mood={mood}
          accent={theme.accent}
          effectColor={theme.particle}
          lastAction={lastAction}
          actionNonce={actionNonce}
          reducedMotion={reducedMotion}
          onPlay={onPlay}
        />
      </Float>
      <Sparkles count={reducedMotion ? 10 : 34} scale={[6.4, 3.4, 3]} size={2.2} speed={reducedMotion ? 0 : 0.35} color={theme.particle} />
      <ContactShadows position={[0, -1.03, 0.4]} opacity={0.32} scale={5} blur={2.4} far={3.5} />
    </>
  )
}

export function PetScene(props: WorldProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.05, 7.4], fov: 38, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      fallback={<div className="webgl-fallback">3D graphics are unavailable. Mori is still safe.</div>}
    >
      <World {...props} />
    </Canvas>
  )
}
