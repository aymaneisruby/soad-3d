import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Float, Image, Sparkles, Text, Text3D, useCursor } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { easing } from 'maath'
import './App.css'

const NAV_ITEMS = [
  { label: 'Discography', href: '#discography' },
  { label: 'Members', href: '#members' },
  { label: 'Tours', href: '#' },
  { label: 'Store', href: '#' },
]

const BAND_MEMBERS = [
  // Source-of-truth dataset for the members section UI + 3D cards.
  // `accent` drives the overlay theme color, and `image` is used both in
  // the list thumbnail and in the in-scene portrait card.
  {
    name: 'Serj Tankian',
    role: 'Lead Vocals, Keyboards',
    signature: 'Operatic range and political lyricism that defines the band identity.',
    accent: '#ff5d46',
    image: '/members/01.png',
  },
  {
    name: 'Daron Malakian',
    role: 'Guitar, Vocals, Songwriting',
    signature: 'Angular riff architecture and melodic hooks across SOAD classics.',
    accent: '#ff8a3a',
    image: '/members/02.png',
  },
  {
    name: 'Shavo Odadjian',
    role: 'Bass',
    signature: 'Heavy low-end motion and stage-driven groove foundation.',
    accent: '#4a7dff',
    image: '/members/03.png',
  },
  {
    name: 'John Dolmayan',
    role: 'Drums',
    signature: 'Precision drumming with explosive dynamic transitions.',
    accent: '#d94bff',
    image: '/members/04.png',
  },
]

const TRACK_FILES = {
  soad: [
    '01-System Of A Down- Suite-Pee.mp3',
    '02-System Of A Down- Know.mp3',
    '03-System Of A Down- Sugar.mp3',
    '04-System Of A Down- Suggestions.mp3',
    '05-System Of A Down- Spiders.mp3',
    '06-System Of A Down- Ddevil.mp3',
    '07-System Of A Down- Soil.mp3',
    '08-System Of A Down- War？.mp3',
    '09-System Of A Down- Mind.mp3',
    '10-System Of A Down- Peephole.mp3',
    '11-System Of A Down- CUBErt.mp3',
    '12-System Of A Down- Darts.mp3',
    '13-System Of A Down- P.L.U.C.K. (Politically Lying, Unholy, Cowardly Killers).mp3',
    '14-System Of A Down- Marmalade.mp3',
    '15-System Of A Down- Störagéd.mp3',
  ],
  toxicity: [
    '01-System Of A Down- Prison Song.mp3',
    '02-System Of A Down- Needles.mp3',
    '03-System Of A Down- Deer Dance.mp3',
    '04-System Of A Down- Jet Pilot.mp3',
    '05-System Of A Down- X.mp3',
    '06-System Of A Down- Chop Suey!.mp3',
    '07-System Of A Down- Bounce.mp3',
    '08-System Of A Down- Forest.mp3',
    '09-System Of A Down- Atwa.mp3',
    '10-System Of A Down- Science.mp3',
    '11-System Of A Down- Shimmy.mp3',
    '12-System Of A Down- Toxicity.mp3',
    '13-System Of A Down- Psycho.mp3',
    '14-System Of A Down- Aerials & Arto.mp3',
    '15-System Of A Down- Johnny.mp3',
  ],
  steal_this_album: [
    "01-System Of A Down- Chic 'n' Stu.mp3",
    '02-System Of A Down- Innervision.mp3',
    '03-System Of A Down- Bubbles.mp3',
    '04-System Of A Down- Boom!.mp3',
    '05-System Of A Down- Nüguns.mp3',
    '06-System Of A Down- A.D.D. (American Dream Denial).mp3',
    '07-System Of A Down- Mr. Jack.mp3',
    '08-System Of A Down- I-E-A-I-A-I-O.mp3',
    '09-System Of A Down- 36.mp3',
    '10-System Of A Down- Pictures.mp3',
    '11-System Of A Down- Highway Song.mp3',
    '12-System Of A Down- Fuck the System.mp3',
    '13-System Of A Down- Ego Brain.mp3',
    '14-System Of A Down- Thetawaves.mp3',
    '15-System Of A Down- Roulette.mp3',
    '16-System Of A Down- Streamline.mp3',
  ],
  mezmerize: [
    '01-System of a Down- Soldier Side (Intro).mp3',
    '02-System of a Down- B.Y.O.B..mp3',
    '03-System of a Down- Revenga.mp3',
    '04-System of a Down- Cigaro.mp3',
    '05-System of a Down- Radio⧸Video.mp3',
    "06-System of a Down- This Cocaine Makes Me Feel Like I'm on This Song.mp3",
    '07-System of a Down- Violent Pornograhpy.mp3',
    '08-System of a Down- Question!.mp3',
    '09-System of a Down- Sad Statue.mp3',
    '10-System of a Down- Old School Hollywood.mp3',
    '11-System of a Down- Lost in Hollywood.mp3',
  ],
  hypnotize: [
    '01-System of a Down- Attack.mp3',
    '02-System of a Down- Dreaming.mp3',
    "03-System of a Down- Kill Rock 'N Roll.mp3",
    '04-System of a Down- Hypnotize.mp3',
    '05-System of a Down- Stealing Society.mp3',
    '06-System of a Down- Tentative.mp3',
    '07-System of a Down- U-Fig.mp3',
    '08-System of a Down- Holy Mountains.mp3',
    '09-System of a Down- Vicinity of Obscenity.mp3',
    "10-System of a Down- She's Like Heroin.mp3",
    '11-System of a Down- Lonely Day.mp3',
    '12-System of a Down- Soldier Side.mp3',
  ],
}

const buildTrack = (dir, file) => {
  const match = file.match(/^(\d+)-.*?- (.+)\.mp3$/i)
  const number = match?.[1] ?? ''
  const title = match?.[2] ?? file.replace(/\.mp3$/i, '')

  return {
    number,
    title,
    src: `/tracks/${dir}/${file}`,
  }
}

const ALBUMS = [
  {
    key: 'soad',
    img: '/albums/soad.jpg',
    cd: '/cds/soad.png',
    name: 'System Of A Down',
    releaseDate: 'June 30, 1998',
    tracks: TRACK_FILES.soad.map((file) => buildTrack('soad', file)),
  },
  {
    key: 'toxicity',
    img: '/albums/toxicity.jpg',
    cd: '/cds/toxicity.png',
    name: 'Toxicity',
    releaseDate: 'September 4, 2001',
    tracks: TRACK_FILES.toxicity.map((file) => buildTrack('toxicity', file)),
  },
  {
    key: 'steal_this_album',
    img: '/albums/steal_this_album.jpg',
    cd: '/cds/steal_this_album.png',
    name: 'Steal This Album!',
    releaseDate: 'November 26, 2002',
    tracks: TRACK_FILES.steal_this_album.map((file) => buildTrack('steal_this_album', file)),
  },
  {
    key: 'mezmerize',
    img: '/albums/mezmerize.jpg',
    cd: '/cds/mezmerize.png',
    name: 'Mezmerize',
    releaseDate: 'May 17, 2005',
    tracks: TRACK_FILES.mezmerize.map((file) => buildTrack('mezmerize', file)),
  },
  {
    key: 'hypnotize',
    img: '/albums/hypnotize.jpg',
    cd: '/cds/hypnotize.png',
    name: 'Hypnotize',
    releaseDate: 'November 22, 2005',
    tracks: TRACK_FILES.hypnotize.map((file) => buildTrack('hypnotize', file)),
  },
]

// Browser rule: a given HTMLMediaElement can only be wrapped once by
// createMediaElementSource() for the document lifetime.
// We cache and reuse the graph per audio element to avoid InvalidStateError,
// including React StrictMode remount cycles in development.
const AUDIO_GRAPH_CACHE = new WeakMap()

const getOrCreateAudioGraph = (audioElement) => {
  const cached = AUDIO_GRAPH_CACHE.get(audioElement)
  if (cached) return cached

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null

  const ctx = new AudioContextClass()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.82

  const source = ctx.createMediaElementSource(audioElement)
  source.connect(analyser)
  analyser.connect(ctx.destination)

  const graph = { ctx, analyser, source }
  AUDIO_GRAPH_CACHE.set(audioElement, graph)
  return graph
}

function AlbumCard({ album, index, position, rotation, focusIndex, onFocus }) {
  const groupRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const isFocused = focusIndex === index

  useCursor(hovered)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (focusIndex === null) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = position[1] + Math.sin(t * 1.6 + position[0]) * 0.12
    }

    const modeScale = focusIndex === null ? 1 : 0.8
    const targetScale = modeScale * (isFocused ? 1.16 : hovered ? 1.04 : 1)
    easing.damp3(groupRef.current.scale, [targetScale, targetScale, targetScale], 0.18, delta)
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation()
        if (event.delta > 4) return
        onFocus(index)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.86, 2.86, 0.12]} />
        <meshStandardMaterial color="#101010" roughness={0.42} metalness={0.86} />
      </mesh>

      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.62, 2.62]} />
        <meshStandardMaterial color={isFocused ? '#3d1515' : '#1a1a1a'} emissive="#100505" metalness={0.1} />
      </mesh>

      <Image url={album.img} position={[0, 0, 0.08]} scale={[2.56, 2.56]} toneMapped={false} />
      <Image
        url="/albums/soad_logo.jpg"
        position={[0, 0, -0.08]}
        rotation={[0, Math.PI, 0]}
        scale={[2.56, 2.56]}
        toneMapped={false}
      />

      <group position={[0, -1.78, 0]}>
        <Text fontSize={0.2} color={isFocused ? '#ffe2dd' : '#f4f2ef'} anchorX="center" anchorY="top">
          {album.name.toUpperCase()}
        </Text>
        <Text
          fontSize={0.12}
          color={isFocused ? '#ff8a74' : '#ff6c57'}
          position={[0, -0.26, 0]}
          anchorX="center"
          anchorY="top"
        >
          {album.releaseDate}
        </Text>
      </group>
    </group>
  )
}

function AlbumCarousel({ focusIndex, onFocus, onDraggingChange }) {
  const groupRef = useRef(null)
  const rotationRef = useRef(0)
  const velocityRef = useRef(0)
  const isDraggingRef = useRef(false)
  const prevPointerXRef = useRef(0)
  const snapTargetRef = useRef(null)
  const { camera, viewport, gl } = useThree()

  const count = ALBUMS.length
  const isMobile = viewport.width < 8
  const defaultZ = isMobile ? 17.6 : 14.4
  const baseRadius = isMobile ? 5.1 : Math.min(6.2, Math.max(5.6, viewport.width * 0.42))
  const activeRadius = focusIndex === null ? baseRadius : baseRadius - 0.35
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const shortestAngle = (from, to) => {
    const twoPi = Math.PI * 2
    return ((((to - from) % twoPi) + Math.PI * 3) % twoPi) - Math.PI
  }

  useEffect(() => {
    if (focusIndex === null) {
      snapTargetRef.current = null
      return
    }
    const target = -(focusIndex / count) * Math.PI * 2
    snapTargetRef.current = target
    velocityRef.current *= 0.35
  }, [focusIndex, count])

  useEffect(() => {
    const domElement = gl.domElement

    const handleWheel = (event) => {
      event.preventDefault()
      velocityRef.current = clamp(velocityRef.current + event.deltaY * -0.00024, -0.08, 0.08)
    }

    const handlePointerDown = (event) => {
      isDraggingRef.current = true
      prevPointerXRef.current = event.clientX
      onDraggingChange(true)
    }

    const handlePointerUp = () => {
      isDraggingRef.current = false
      onDraggingChange(false)
    }

    const handlePointerMove = (event) => {
      if (!isDraggingRef.current) return
      const deltaX = event.clientX - prevPointerXRef.current
      velocityRef.current = clamp(velocityRef.current + deltaX * -0.00092, -0.08, 0.08)
      prevPointerXRef.current = event.clientX
    }

    domElement.addEventListener('wheel', handleWheel, { passive: false })
    domElement.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      domElement.removeEventListener('wheel', handleWheel)
      domElement.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [focusIndex, gl.domElement, onDraggingChange, onFocus])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    rotationRef.current += velocityRef.current
    velocityRef.current *= 0.955

    if (focusIndex !== null && !isDraggingRef.current && snapTargetRef.current !== null) {
      const diff = shortestAngle(rotationRef.current, snapTargetRef.current)
      rotationRef.current += diff * Math.min(1, delta * 5.8)
      if (Math.abs(diff) < 0.002) snapTargetRef.current = null
    }

    groupRef.current.rotation.y = rotationRef.current

    if (focusIndex === null) {
      easing.damp3(groupRef.current.position, [0, 0, 0], 0.5, delta)
      easing.damp3(camera.position, [0, 0, defaultZ], 0.5, delta)
      easing.dampE(camera.rotation, [0, 0, 0], 0.5, delta)
      return
    }

    const focusedX = isMobile ? -2.3 : -2.75
    const focusedY = 0
    easing.damp3(groupRef.current.position, [focusedX, focusedY, 0], 0.52, delta)
    easing.damp3(camera.position, [0, 0, defaultZ], 0.5, delta)
    easing.dampE(camera.rotation, [0, 0, 0], 0.5, delta)
  })

  return (
    <group ref={groupRef}>
      {ALBUMS.map((album, index) => {
        const angle = (index / count) * Math.PI * 2
        const x = Math.sin(angle) * activeRadius
        const z = Math.cos(angle) * activeRadius

        return (
          <AlbumCard
            key={album.key}
            album={album}
            index={index}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            focusIndex={focusIndex}
            onFocus={onFocus}
          />
        )
      })}
    </group>
  )
}

function MainTitle() {
  const { viewport } = useThree()
  const scale = viewport.width < 8 ? 0.42 : 0.84

  return (
    <Center>
      <Float speed={1.35} floatIntensity={0.17} rotationIntensity={0.06}>
        <group scale={scale}>
          <Text3D
            font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
            size={1}
            height={0.18}
            letterSpacing={0.04}
            bevelEnabled
            bevelThickness={0.03}
            bevelSize={0.03}
            bevelSegments={5}
            position={[0, -0.01, -0.04]}
          >
            SYSTEM OF A DOWN
            <meshStandardMaterial color="#2a0907" roughness={0.78} metalness={0.45} />
          </Text3D>
          <Text3D
            font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
            size={1}
            height={0.13}
            letterSpacing={0.04}
            bevelEnabled
            bevelThickness={0.024}
            bevelSize={0.022}
            bevelSegments={5}
            position={[0, 0, 0.03]}
          >
            SYSTEM OF A DOWN
            <meshStandardMaterial color="#d63f2d" emissive="#3a0906" emissiveIntensity={0.55} roughness={0.44} metalness={0.72} />
          </Text3D>
        </group>
      </Float>
    </Center>
  )
}

function SceneEffects() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom intensity={0.66} luminanceThreshold={0.24} radius={0.58} mipmapBlur />
      <Noise opacity={0.018} />
      <Vignette eskil={false} offset={0.16} darkness={0.96} />
      <ChromaticAberration offset={[0.0002, 0.0002]} />
    </EffectComposer>
  )
}

function TopNav() {
  return (
    <header className="app-nav">
      <div className="brand-lockup">
        <img src="/logo.png" alt="System Of A Down" className="app-logo" />
        <p className="brand-meta">3D Listening Vault</p>
      </div>
      <nav className="app-nav-links">
        {NAV_ITEMS.map((item) => (
          <a key={item.label} href={item.href} className="app-nav-link">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function HeroCopy({ focused, pinned, onToggle }) {
  return (
    <section className={`hero-copy ${pinned ? 'is-open' : 'is-collapsed'} ${focused ? 'is-focused' : ''}`}>
      <button type="button" className="hero-toggle" onClick={onToggle}>
        {pinned ? 'Hide Brief' : 'Show Brief'}
      </button>
      <div className="hero-body">
        <p className="hero-kicker">Immersive Catalog Experience</p>
        <h1 className="hero-title">Explore SOAD albums in a kinetic 3D gallery.</h1>
        <p className="hero-subtitle">Drag to spin the ring, click a cover to lock focus, then play tracks instantly.</p>
        <a href="#members" className="hero-cta">
          Meet The Band
        </a>
      </div>
    </section>
  )
}

function MembersScene({ members, selected, onSelect }) {
  // Holds refs to each 3D card so we can animate them every frame.
  const cardsRef = useRef([])
  // Tracks pointer drag state to detect horizontal swipe gestures.
  const dragRef = useRef({ down: false, startX: 0, moved: 0 })
  const { camera, gl } = useThree()
  const count = members.length

  const getRelativeIndex = (idx) => {
    // Convert absolute index to shortest circular distance from selection.
    // Example with 4 items: selected=0, idx=3 => rel=-1 (left neighbor).
    const raw = idx - selected
    const half = Math.floor(count / 2)
    if (raw > half) return raw - count
    if (raw < -half) return raw + count
    return raw
  }

  useEffect(() => {
    const domElement = gl.domElement

    const onDown = (event) => {
      // Start drag tracking on canvas pointer down.
      dragRef.current = { down: true, startX: event.clientX, moved: 0 }
    }
    const onMove = (event) => {
      if (!dragRef.current.down) return
      // Keep latest horizontal movement since drag start.
      dragRef.current.moved = event.clientX - dragRef.current.startX
    }
    const onUp = () => {
      if (!dragRef.current.down) return
      const delta = dragRef.current.moved
      // Swipe threshold: move to previous/next member when drag is intentional.
      if (delta > 48) onSelect((selected - 1 + count) % count)
      if (delta < -48) onSelect((selected + 1) % count)
      // Reset drag state after pointer release.
      dragRef.current = { down: false, startX: 0, moved: 0 }
    }
    const onWheel = (event) => {
      // Ignore tiny wheel jitter and only use meaningful scroll deltas.
      if (Math.abs(event.deltaY) < 12) return
      // Scroll down => next, scroll up => previous.
      if (event.deltaY > 0) onSelect((selected + 1) % count)
      else onSelect((selected - 1 + count) % count)
    }
    const onKey = (event) => {
      // Keyboard fallback for accessibility and desktop navigation.
      if (event.key === 'ArrowLeft') onSelect((selected - 1 + count) % count)
      if (event.key === 'ArrowRight') onSelect((selected + 1) % count)
    }

    domElement.addEventListener('pointerdown', onDown)
    domElement.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)

    return () => {
      domElement.removeEventListener('pointerdown', onDown)
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [count, gl.domElement, onSelect, selected])

  useFrame((_, delta) => {
    cardsRef.current.forEach((card, idx) => {
      if (!card) return
      // Relative slot around the center card (0=center, -1 left, +1 right...).
      const rel = getRelativeIndex(idx)
      const absRel = Math.abs(rel)

      // Stage layout: spread cards horizontally and push non-selected cards back.
      const targetX = rel * 2.55
      // Subtle idle bob for the selected card; stepped vertical offset otherwise.
      const targetY = absRel === 0 ? Math.sin(performance.now() * 0.0018) * 0.06 : -0.08 * absRel
      const targetZ = -absRel * 2.35
      const targetRotY = rel * -0.36
      // Emphasize selected card, then immediate neighbors, then distant cards.
      const targetScale = absRel === 0 ? 1.06 : absRel === 1 ? 0.86 : 0.7

      // Smoothly interpolate transform targets for cinematic movement.
      easing.damp3(card.position, [targetX, targetY, targetZ], 0.19, delta)
      easing.dampE(card.rotation, [0, targetRotY, 0], 0.19, delta)
      easing.damp3(card.scale, [targetScale, targetScale, targetScale], 0.19, delta)
      // Only render cards close to the viewport center for clarity/perf.
      card.visible = absRel <= 2
    })

    // Keep members camera locked to a consistent framing.
    easing.damp3(camera.position, [-1.05, 0, 11.8], 0.4, delta)
    easing.dampE(camera.rotation, [0, 0, 0], 0.4, delta)
  })

  return (
    <>
      <color attach="background" args={['#040404']} />
      <fog attach="fog" args={['#040404', 8, 30]} />
      <ambientLight intensity={0.34} color="#f5f5f5" />
      <hemisphereLight intensity={0.42} color="#ffffff" groundColor="#1a1a1a" />
      <pointLight position={[0, 4.8, 8]} intensity={60} color="#ffffff" />
      <spotLight position={[10, 10, 9]} angle={0.44} intensity={420} color="#ff785f" penumbra={0.6} />
      <spotLight position={[-10, -1, 10]} angle={0.42} intensity={260} color="#4d84ff" penumbra={0.5} />
      <Environment preset="city" blur={0.9} />
      <group>
        {members.map((member, idx) => (
          <group
            key={member.name}
            // Store node by index so `useFrame` can animate by logical order.
            ref={(el) => {
              cardsRef.current[idx] = el
            }}
            onClick={(event) => {
              event.stopPropagation()
              // Clicking a card jumps directly to that member.
              onSelect(idx)
            }}
          >
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[2.45, 3.22, 0.16]} />
              <meshStandardMaterial color="#0e0e0e" roughness={0.36} metalness={0.88} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[2.28, 3.02]} />
              <meshStandardMaterial color="#171717" emissive="#100808" emissiveIntensity={0.25} />
            </mesh>
            <Image url={member.image} position={[0, 0, 0.08]} scale={[2.04, 2.86]} toneMapped={false} />
            <Text
              position={[0, -1.92, 0.08]}
              fontSize={0.12}
              maxWidth={2.15}
              textAlign="center"
              lineHeight={1}
              color="#f7f2ea"
              anchorX="center"
            >
              {member.name.toUpperCase()}
            </Text>
          </group>
        ))}
      </group>
      <Sparkles count={160} scale={18} size={2.2} speed={0.22} opacity={0.28} color="#ff5b3a" />
      <SceneEffects />
    </>
  )
}

function BandMembersSection({ members, index, onPrev, onNext, onSelect }) {
  // Current member object backing all right-side overlay content.
  const member = members[index]

  return (
    <section id="members" className="members-shell">
      <div className="members-canvas-wrap">
        {/* Dedicated canvas for the members carousel experience. */}
        <Canvas camera={{ position: [0, 0, 12], fov: 42 }} dpr={[1.5, 3]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <MembersScene members={members} selected={index} onSelect={onSelect} />
        </Canvas>
      </div>

      {/* Overlay panel stays in sync with selected member + accent color. */}
      <aside className="members-overlay" style={{ '--member-accent': member.accent }}>
        <p className="members-kicker">System Of A Down</p>
        <h2 className="members-title">Band Members</h2>
        <p className="members-copy">Fast spotlight navigation for each artist profile in an immersive 3D stage.</p>
        <div className="member-controls">
          <button type="button" className="panel-btn panel-btn-ghost" onClick={onPrev}>
            Previous
          </button>
          <span className="member-counter">
            {/* 01 / 04 style counter keeps fixed-width visual rhythm. */}
            {String(index + 1).padStart(2, '0')} / {String(members.length).padStart(2, '0')}
          </span>
          <button type="button" className="panel-btn" onClick={onNext}>
            Next
          </button>
        </div>
        <div className="member-list">
          {members.map((item, memberIdx) => (
            <button
              key={item.name}
              type="button"
              className={`member-list-item ${memberIdx === index ? 'is-active' : ''}`}
              // Direct index selection from the thumbnail list.
              onClick={() => onSelect(memberIdx)}
            >
              <img src={item.image} alt={item.name} className="member-thumb" loading="lazy" />
              <span className="member-list-text">
                <span className="member-list-name">{item.name}</span>
                <span className="member-list-role">{item.role}</span>
              </span>
            </button>
          ))}
        </div>
        <article className="member-card">
          <p className="member-kicker">Band Spotlight</p>
          <h3 className="member-name">{member.name}</h3>
          <p className="member-role">{member.role}</p>
          <p className="member-signature">{member.signature}</p>
        </article>
      </aside>
    </section>
  )
}

function AlbumDetails({ album, nowPlaying, isPlaying, onTrackSelect, onClose }) {
  if (!album) return null

  const hasCurrentAlbumTrack = album.tracks.some((track) => track.src === nowPlaying?.src)

  return (
    <aside className="album-panel" aria-live="polite">
      <div className={`cd-visual ${isPlaying && hasCurrentAlbumTrack ? 'is-spinning' : ''}`}>
        <div className="cd-rotor">
          <img src={album.cd} alt={`${album.name} disc`} />
        </div>
      </div>

      <p className="album-panel-label">Selected Release</p>
      <h2 className="album-panel-title">{album.name}</h2>
      <p className="album-panel-date">{album.releaseDate}</p>

      <div className="panel-controls">
        <button type="button" className="panel-btn panel-btn-ghost" onClick={onClose}>
          Back
        </button>
      </div>

      <p className="album-panel-section">Tracks</p>
      <ol className="album-panel-list">
        {album.tracks.map((track, index) => {
          const active = nowPlaying?.src === track.src
          return (
            <li key={track.src}>
              <button
                type="button"
                className={`track-btn ${active ? 'is-active' : ''}`}
                onClick={() => onTrackSelect(index)}
              >
                <span className="track-main">
                  <span className="track-index">{track.number}</span>
                  <span className="track-title">{track.title}</span>
                </span>
                {active && <span className="track-status">{isPlaying ? 'Playing' : 'Paused'}</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function AudioSpectrum({ audioRef, isPlaying }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const dataRef = useRef(null)
  const isPlayingRef = useRef(isPlaying)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const graph = getOrCreateAudioGraph(audio)
    if (!graph) return undefined

    audioCtxRef.current = graph.ctx
    analyserRef.current = graph.analyser
    dataRef.current = new Uint8Array(graph.analyser.frequencyBinCount)

    const draw = () => {
      const canvas = canvasRef.current
      const analyserNode = analyserRef.current
      const data = dataRef.current
      if (!canvas || !analyserNode || !data) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width && height && (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr))) {
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(height * dpr)
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      analyserNode.getByteFrequencyData(data)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      const bars = 42
      const gap = 2
      const barWidth = Math.max(2, (width - (bars - 1) * gap) / bars)
      const binsPerBar = Math.max(1, Math.floor(data.length / bars))
      const grad = ctx.createLinearGradient(0, 0, width, 0)
      grad.addColorStop(0, '#7d2017')
      grad.addColorStop(0.5, '#d24e35')
      grad.addColorStop(1, '#f0b69a')
      ctx.fillStyle = grad

      for (let i = 0; i < bars; i += 1) {
        let sum = 0
        const start = i * binsPerBar
        for (let j = 0; j < binsPerBar; j += 1) sum += data[start + j] || 0
        const avg = sum / binsPerBar
        const energy = isPlayingRef.current ? avg / 255 : 0.06
        const barHeight = Math.max(2, energy * (height - 2))
        const x = i * (barWidth + gap)
        const y = height - barHeight
        ctx.fillRect(x, y, barWidth, barHeight)
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      // Keep shared graph alive; only stop this component's draw loop.
      analyserRef.current = null
      audioCtxRef.current = null
      dataRef.current = null
    }
  }, [audioRef])

  useEffect(() => {
    if (!isPlaying) return
    const ctx = audioCtxRef.current
    if (!ctx || ctx.state !== 'suspended') return
    ctx.resume().catch(() => {})
  }, [isPlaying])

  return (
    <div className="global-visualizer" aria-hidden="true">
      <canvas ref={canvasRef} className="global-visualizer-canvas" />
    </div>
  )
}

function GlobalPlayer({
  nowPlaying,
  isPlaying,
  onPauseResume,
  onOpenAlbum,
  onPrev,
  onNext,
  currentTime,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  audioRef,
  isExpanded,
  onExpand,
  onCollapse,
  onToggleExpanded,
  isDockLeft,
}) {
  if (!nowPlaying) return null

  return (
    <section
      className={`global-player ${isExpanded ? 'is-open' : ''} ${isDockLeft ? 'is-dock-left' : ''}`}
      aria-live="polite"
      onMouseLeave={onCollapse}
    >
      <button
        type="button"
        className="global-disc-btn"
        onMouseEnter={onExpand}
        onFocus={onExpand}
        onClick={onToggleExpanded}
        aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
      >
        <div className={`global-disc ${isPlaying ? 'is-spinning' : ''}`}>
          <img src={nowPlaying.albumCd} alt={`${nowPlaying.albumName} disc`} />
        </div>
      </button>
      <div className="global-player-body">
        <div className="global-meta">
          <p className="global-kicker">Now Playing</p>
          <p className="global-title">{nowPlaying.title}</p>
          <p className="global-subtitle">
            {nowPlaying.albumName} · {nowPlaying.number}
          </p>
        </div>
        <div className="global-actions">
          <button type="button" className="panel-btn panel-btn-ghost" onClick={onPrev}>
            Prev
          </button>
          <button type="button" className="panel-btn" onClick={onPauseResume}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="panel-btn panel-btn-ghost" onClick={onNext}>
            Next
          </button>
          <button type="button" className="panel-btn panel-btn-ghost" onClick={onOpenAlbum}>
            Open Album
          </button>
        </div>
        <div className="global-progress">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            value={Math.min(currentTime, duration || 0)}
            onInput={onSeek}
            onChange={onSeek}
            aria-label="Playback position"
          />
          <span>{formatTime(duration)}</span>
        </div>
        <div className="global-extra">
          <div className="global-volume">
            <button type="button" className="panel-btn panel-btn-ghost" onClick={onToggleMute}>
              {isMuted || volume === 0 ? 'Unmute' : 'Mute'}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onInput={onVolumeChange}
              onChange={onVolumeChange}
              aria-label="Volume"
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <AudioSpectrum audioRef={audioRef} isPlaying={isPlaying} />
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [focusIndex, setFocusIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [nowPlaying, setNowPlaying] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false)
  const [infoPinned, setInfoPinned] = useState(false)
  // Single source of current member selection for the entire members section.
  const [memberIndex, setMemberIndex] = useState(0)
  const audioRef = useRef(null)
  const skipAutoStartRef = useRef(false)
  const activeMember = BAND_MEMBERS[memberIndex]

  const focusedAlbum = useMemo(() => (focusIndex === null ? null : ALBUMS[focusIndex]), [focusIndex])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setFocusIndex(null)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !nowPlaying) return

    setCurrentTime(0)
    setDuration(0)
    audio.src = nowPlaying.src
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }, [nowPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = isMuted
  }, [isMuted, volume])

  const startTrack = useCallback((albumKey, trackIndex) => {
    const album = ALBUMS.find((item) => item.key === albumKey)
    if (!album) return
    const track = album.tracks[trackIndex]
    if (!track) return
    setNowPlaying({
      ...track,
      albumKey: album.key,
      albumName: album.name,
      albumCd: album.cd,
      albumTrackIndex: trackIndex,
    })
  }, [])

  useEffect(() => {
    if (focusIndex === null) return
    if (skipAutoStartRef.current) {
      skipAutoStartRef.current = false
      return
    }
    const album = ALBUMS[focusIndex]
    if (!album || album.tracks.length === 0) return
    startTrack(album.key, 0)
  }, [focusIndex, startTrack])

  const handleTrackSelect = (trackIndex) => {
    if (focusIndex === null) return
    const album = ALBUMS[focusIndex]
    const track = album.tracks[trackIndex]
    if (!track) return

    if (nowPlaying?.src === track.src && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      } else {
        audioRef.current.pause()
      }
      return
    }

    startTrack(album.key, trackIndex)
  }

  const handlePauseResume = () => {
    const audio = audioRef.current
    if (!audio || !nowPlaying) return
    if (audio.paused) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }

  const handlePrev = () => {
    if (!nowPlaying) return
    const prevIndex = nowPlaying.albumTrackIndex - 1
    if (prevIndex >= 0) startTrack(nowPlaying.albumKey, prevIndex)
  }

  const handleNext = () => {
    if (!nowPlaying) return
    const album = ALBUMS.find((item) => item.key === nowPlaying.albumKey)
    if (!album) return
    const nextIndex = nowPlaying.albumTrackIndex + 1
    if (nextIndex < album.tracks.length) startTrack(nowPlaying.albumKey, nextIndex)
  }

  const handleSeek = (event) => {
    const audio = audioRef.current
    if (!audio) return
    const time = Number(event.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value) / 100
    setVolume(nextVolume)
    if (nextVolume > 0 && isMuted) setIsMuted(false)
  }

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const handleExpandPlayer = () => setIsPlayerExpanded(true)
  const handleCollapsePlayer = () => setIsPlayerExpanded(false)
  const handleTogglePlayerExpanded = () => setIsPlayerExpanded((prev) => !prev)

  const handlePrevMember = () => {
    // Circular navigation: move left, wrapping to the last member.
    setMemberIndex((prev) => (prev - 1 + BAND_MEMBERS.length) % BAND_MEMBERS.length)
  }

  const handleNextMember = () => {
    // Circular navigation: move right, wrapping back to index 0.
    setMemberIndex((prev) => (prev + 1) % BAND_MEMBERS.length)
  }

  const cursorClass = focusIndex !== null ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'

  return (
    <>
      <main id="discography" className={`app-shell ${cursorClass}`}>
        <TopNav />
        <HeroCopy focused={focusIndex !== null} pinned={infoPinned} onToggle={() => setInfoPinned((prev) => !prev)} />

        <AlbumDetails
          album={focusedAlbum}
          nowPlaying={nowPlaying}
          isPlaying={isPlaying}
          onTrackSelect={handleTrackSelect}
          onClose={() => setFocusIndex(null)}
        />
        <GlobalPlayer
          nowPlaying={nowPlaying}
          isPlaying={isPlaying}
          onPauseResume={handlePauseResume}
          onPrev={handlePrev}
          onNext={handleNext}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          audioRef={audioRef}
          isExpanded={isPlayerExpanded}
          onExpand={handleExpandPlayer}
          onCollapse={handleCollapsePlayer}
          onToggleExpanded={handleTogglePlayerExpanded}
          isDockLeft={focusIndex === null}
          onOpenAlbum={() => {
            if (!nowPlaying) return
            skipAutoStartRef.current = true
            const targetIndex = ALBUMS.findIndex((album) => album.key === nowPlaying.albumKey)
            if (targetIndex >= 0) setFocusIndex(targetIndex)
          }}
        />

        <div className="canvas-wrap">
          <Canvas
            camera={{ position: [0, 0, 14], fov: 42 }}
            dpr={[1.5, 3]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onPointerMissed={() => setFocusIndex(null)}
          >
            <color attach="background" args={['#040404']} />
            <fog attach="fog" args={['#040404', 9, 31]} />

            <ambientLight intensity={0.34} color="#f5f5f5" />
            <hemisphereLight intensity={0.42} color="#ffffff" groundColor="#1a1a1a" />
            <pointLight position={[0, 5.2, 8]} intensity={64} color="#ffffff" />
            <spotLight position={[10, 10, 9]} angle={0.44} intensity={420} color="#ff785f" penumbra={0.6} />
            <spotLight position={[-10, -1, 10]} angle={0.42} intensity={260} color="#4d84ff" penumbra={0.5} />

            <Environment preset="city" blur={0.9} />
            <AlbumCarousel focusIndex={focusIndex} onFocus={setFocusIndex} onDraggingChange={setIsDragging} />
            {focusIndex === null && <MainTitle />}
            <Sparkles count={200} scale={20} size={2.5} speed={0.24} opacity={0.32} color="#ff5b3a" />
            <SceneEffects />
          </Canvas>
        </div>

        <audio
          ref={audioRef}
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={handleNext}
        />
      </main>

      {/*
        Members section disabled per request.
        Kept in codebase for easy re-enable later.
      */}
      {/*
      <BandMembersSection
        members={BAND_MEMBERS}
        index={memberIndex}
        // Parent owns state; section receives pure callbacks for navigation.
        onPrev={handlePrevMember}
        onNext={handleNextMember}
        onSelect={setMemberIndex}
      />
      */}
    </>
  )
}



