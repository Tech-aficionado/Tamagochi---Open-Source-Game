import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { PetMood, ThemeDefinition } from '../game/types'

interface PetProps {
  mood: PetMood
  accent: string
  actionNonce: number
  reducedMotion: boolean
  onPlay: () => void
}

function Pet({ mood, accent, actionNonce, reducedMotion, onPlay }: PetProps) {
  const group = useRef<THREE.Group>(null)
  const pulse = useRef(0)

  useEffect(() => {
    pulse.current = 1
  }, [actionNonce])

  useFrame((state, delta) => {
    if (!group.current) return
    const time = state.clock.elapsedTime
    const idle = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.07
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, idle, 0.12)
    group.current.rotation.z = reducedMotion ? 0 : Math.sin(time * 1.4) * 0.035
    pulse.current = Math.max(0, pulse.current - delta * 1.8)
    const bounce = Math.sin((1 - pulse.current) * Math.PI) * pulse.current * 0.18
    group.current.scale.setScalar(1 + bounce)
  })

  const sleepy = mood === 'sleepy' || mood === 'unwell'
  const grumpy = mood === 'grumpy'

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
        <sphereGeometry args={[0.28, 20, 16]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.48, -0.62, 0.08]} scale={[1.2, 0.65, 1.2]}>
        <sphereGeometry args={[0.28, 20, 16]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh position={[-0.27, 0.25, 0.7]} scale={[1, sleepy ? 0.12 : 1, 0.55]}>
        <sphereGeometry args={[0.105, 16, 12]} />
        <meshStandardMaterial color="#211a2a" roughness={0.25} />
      </mesh>
      <mesh position={[0.27, 0.25, 0.7]} scale={[1, sleepy ? 0.12 : 1, 0.55]}>
        <sphereGeometry args={[0.105, 16, 12]} />
        <meshStandardMaterial color="#211a2a" roughness={0.25} />
      </mesh>
      {!sleepy && (
        <>
          <mesh position={[-0.295, 0.29, 0.76]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[0.245, 0.29, 0.76]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
        </>
      )}
      <mesh position={[0, grumpy ? -0.02 : 0.01, 0.76]} rotation={[0, 0, grumpy ? Math.PI : 0]}>
        <torusGeometry args={[0.105, 0.022, 8, 18, Math.PI]} />
        <meshBasicMaterial color="#4c2933" />
      </mesh>
      <mesh position={[-0.49, 0.04, 0.65]} scale={[1.4, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 12, 10]} /><meshBasicMaterial color="#ef7f89" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0.49, 0.04, 0.65]} scale={[1.4, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 12, 10]} /><meshBasicMaterial color="#ef7f89" transparent opacity={0.55} />
      </mesh>
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
  actionNonce: number
  reducedMotion: boolean
  onPlay: () => void
}

function World({ theme, mood, actionNonce, reducedMotion, onPlay }: WorldProps) {
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
        <Pet mood={mood} accent={theme.accent} actionNonce={actionNonce} reducedMotion={reducedMotion} onPlay={onPlay} />
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