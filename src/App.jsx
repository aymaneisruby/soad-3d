import React, { useRef, useState, useEffect } from 'react'

import { Canvas, useFrame, useThree } from '@react-three/fiber'

import { Text, Text3D, Center, Image, Environment, Sparkles, Float, useCursor } from '@react-three/drei'

import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'

import * as THREE from 'three'

import { easing } from 'maath'



// --- DATA ---

// Added "tracks" for the futuristic tracklist feature

const ALBUMS = [

  {

    img: '/albums/soad.jpg',

    name: 'SYSTEM OF A DOWN',

    year: 'Jun 30, 1998',

    tracks: ['Suite-Pee', 'Know', 'Sugar', 'Spiders', 'War?']

  },

  {

    img: '/albums/toxicity.jpg',

    name: 'TOXICITY',

    year: 'Sep 4, 2001',

    tracks: ['Prison Song', 'Needles', 'Deer Dance', 'Chop Suey!', 'Bounce']

  },

  {

    img: '/albums/steal_this_album.jpg',

    name: 'STEAL THIS ALBUM!',

    year: 'Nov 26, 2002',

    tracks: ['Chic \'N\' Stu', 'Innervision', 'Bubbles', 'Boom!', 'I-E-A-I-A-I-O']

  },

  {

    img: '/albums/mezmerize.jpg',

    name: 'MEZMERIZE',

    year: 'May 17, 2005',

    tracks: ['Soldier Side', 'B.Y.O.B.', 'Revenga', 'Cigaro', 'Radio/Video']

  },

  {

    img: '/albums/hypnotize.jpg',

    name: 'HYPNOTIZE',

    year: 'Nov 22, 2005',

    tracks: ['Attack', 'Dreaming', 'Kill Rock \'n Roll', 'Hypnotize', 'Lonely Day']

  },

  {

    img: '/albums/protect_the_land.jpg',

    name: 'Protect The Land / Genocidal Humanoidz',

    year: 'Nov 6, 2020',

    tracks: []

  },

]



// --- COMPONENTS ---



function Tracklist({ tracks, visible }) {

  // This is the holographic list that appears when you click

  return (

    <group position={[2.5, 0, 0]} visible={visible}>

      {tracks.map((track, i) => (

        <Text

          key={i}

          position={[0, 1.2 - (i * 0.4), 0]} // Stack them vertically

          fontSize={0.2}

          color={visible ? "#fff" : "transparent"} // Fade in logic could go here

          anchorX="left"

          font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff" // Safe standard font

        >

          {i + 1}. {track.toUpperCase()}

        </Text>

      ))}

    </group>

  )

}



function RouletteItem({ url, name, year, tracks, position, rotation, index, setFocus, focusIndex }) {

  const groupRef = useRef()

  const [hovered, setHover] = useState(false)

 

  useCursor(hovered)

 

  // Is this specific album focused?

  const isFocused = focusIndex === index



  useFrame((state, delta) => {

    // Floating animation (stops when focused so it's easier to read)

    if (focusIndex === null) {

      const t = state.clock.getElapsedTime()

      groupRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.1

    }

   

    // Scale Logic:

    // If focused: Grow Big (1.5)

    // If hovered: Grow slightly (1.1)

    // Else: Normal (1)

    const targetScale = isFocused ? 1.5 : (hovered ? 1.1 : 1)

    easing.damp3(groupRef.current.scale, [targetScale, targetScale, targetScale], 0.1, delta)

  })



  return (

    <group

      ref={groupRef}

      position={position}

      rotation={rotation}

      onClick={(e) => {

        e.stopPropagation()

        setFocus(index)

      }}

      onPointerOver={() => setHover(true)}

      onPointerOut={() => setHover(false)}

    >

      {/* FRAME */}

      <mesh>

        <boxGeometry args={[3.2, 3.2, 0.1]} />

        <meshStandardMaterial color="#222" roughness={0.4} metalness={0.6} />

      </mesh>



      {/* FRONT IMAGE */}

      <Image url={url} position={[0, 0, 0.06]} scale={[3, 3]} toneMapped={false} />



      {/* BACK LOGO */}

      <Image url="/albums/soad_logo.jpg" position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]} scale={[3, 3]} toneMapped={false} />



      {/* METADATA LABELS (Name & Year) */}

      {/* We hide these when the album is focused to make room for the tracklist */}

      <group position={[0, -2, 0]} visible={!isFocused}>

        <Text

          fontSize={0.25}

          color="white"

          anchorY="top"

          anchorX="center"

          position={[0, 0, 0]}

        >

          {name}

        </Text>

        <Text

          fontSize={0.15}

          color="#ff0000"

          anchorY="top"

          anchorX="center"

          position={[0, -0.3, 0]}

        >

          {year}

        </Text>

      </group>



      {/* THE FUTURISTIC TRACKLIST */}

      {/* Only visible when focused */}

      <Tracklist tracks={tracks} visible={isFocused} />



    </group>

  )

}



function Carousel({ setFocus, focusIndex }) {

  const groupRef = useRef()

  const rotationRef = useRef(0)

  const velocityRef = useRef(0)

  const isDragging = useRef(false)

  const prevPointerX = useRef(0)



  const radius = 7

  const count = ALBUMS.length

  const { camera, viewport } = useThree()

 

  const isMobile = viewport.width < 8

  const defaultZ = isMobile ? 22 : 14



  useEffect(() => {

    const handleWheel = (e) => {

      if (focusIndex !== null) {

        setFocus(null)

        return

      }

      velocityRef.current += e.deltaY * 0.0005

    }



    const handlePointerDown = (e) => {

      if (focusIndex !== null) return

      isDragging.current = true

      prevPointerX.current = e.clientX

    }



    const handlePointerUp = () => {

      isDragging.current = false

    }



    const handlePointerMove = (e) => {

      if (!isDragging.current || focusIndex !== null) return

      const deltaX = e.clientX - prevPointerX.current

      velocityRef.current += deltaX * 0.002

      prevPointerX.current = e.clientX

    }



    window.addEventListener('wheel', handleWheel)

    window.addEventListener('pointerdown', handlePointerDown)

    window.addEventListener('pointerup', handlePointerUp)

    window.addEventListener('pointermove', handlePointerMove)



    return () => {

      window.removeEventListener('wheel', handleWheel)

      window.removeEventListener('pointerdown', handlePointerDown)

      window.removeEventListener('pointerup', handlePointerUp)

      window.removeEventListener('pointermove', handlePointerMove)

    }

  }, [focusIndex])





  useFrame((state, delta) => {

    rotationRef.current += velocityRef.current

    velocityRef.current *= 0.95



    if (focusIndex === null) {

        groupRef.current.rotation.y = rotationRef.current

        easing.damp3(camera.position, [0, 0, defaultZ], 0.5, delta)

        easing.dampE(camera.rotation, [0, 0, 0], 0.5, delta)

    } else {

        const targetRotation = -(focusIndex / count) * Math.PI * 2

        easing.damp(groupRef.current.rotation, 'y', targetRotation, 0.5, delta)

        // Move closer for the "Deconstruction" view

        // Shift camera slightly to the left (-2) so the album is on the left

        // and tracklist is on the right

        const closeUpZ = radius + 6

        easing.damp3(camera.position, [-2, 0, closeUpZ], 0.5, delta)

    }

  })



  return (

    <group ref={groupRef}>

      {ALBUMS.map((album, index) => {

        const angle = (index / count) * Math.PI * 2

        const x = Math.sin(angle) * radius

        const z = Math.cos(angle) * radius

       

        return (

          <RouletteItem

            key={index}

            index={index}

            url={album.img}

            name={album.name}

            year={album.year}

            tracks={album.tracks}

            position={[x, 0, z]}

            rotation={[0, angle, 0]}

            setFocus={setFocus}

            focusIndex={focusIndex}

          />

        )

      })}

    </group>

  )

}



function MainTitle({ visible }) {

  const { viewport } = useThree()

  const scale = viewport.width < 8 ? 0.45 : 0.9



  return (

    <Center position={[0, 0, 0]} visible={visible}>

      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>

        <group scale={scale}>

          <Text3D

            font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"

            size={1} height={0.1} letterSpacing={0.1}

            bevelEnabled bevelThickness={0.02} bevelSize={0.02} bevelSegments={3}

          >

            SYSTEM OF A DOWN

            <meshStandardMaterial color="#444" roughness={0.8} metalness={0.7} />

          </Text3D>

        </group>

      </Float>

    </Center>

  )

}



function DynamicEffects() {

    return (

        <EffectComposer disableNormalPass>

            <Bloom luminanceThreshold={0.2} intensity={0.8} radius={0.5} mipmapBlur />

            <Noise opacity={0.05} />

            <Vignette eskil={false} offset={0.1} darkness={1.0} />

            <ChromaticAberration offset={[0.001, 0.001]} />

        </EffectComposer>

    )

}



export default function App() {

  const [focusIndex, setFocus] = useState(null)



  return (

    <div style={{ width: '100vw', height: '100vh', background: '#000', cursor: focusIndex === null ? 'grab' : 'auto' }}>

     

      {/* NAVBAR */}

      <nav style={{

        position: 'absolute', top: 0, left: 0, width: '100%',

        padding: '20px 40px', boxSizing: 'border-box',

        display: 'flex', justifyContent: 'space-between', alignItems: 'center',

        zIndex: 100, pointerEvents: 'none'

      }}>

        <div style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: '2px', pointerEvents: 'auto', cursor: 'pointer' }}>

          <img src='/logo.png'  style={{ width:'150px', height:'40px'}}/>

        </div>

        <div style={{ display: 'flex', gap: '30px', pointerEvents: 'auto' }}>

          {['HOME', 'TOURS', 'MUSIC', 'STORE'].map((item) => (

            <a key={item} href="#" style={{

              color: 'white', textDecoration: 'none', fontFamily: 'sans-serif',

              fontSize: '14px', letterSpacing: '1px', opacity: 0.8, transition: 'opacity 0.2s'

            }}

            onMouseOver={(e) => e.target.style.opacity = 1}

            onMouseOut={(e) => e.target.style.opacity = 0.8}

            >

              {item}

            </a>

          ))}

        </div>

      </nav>



      {/* CANVAS */}

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}

           onClick={() => setFocus(null)}>

        <Canvas camera={{ position: [0, 0, 14], fov: 45 }} dpr={[1, 2]}>

          <color attach="background" args={['#050505']} />

          <fog attach="fog" args={['#050505', 10, 30]} />

          <pointLight position={[0, 5, 10]} intensity={100} color="white" />

          <spotLight position={[10, 10, 10]} angle={0.5} intensity={500} color="#ff0000" />

          <spotLight position={[-10, 0, 10]} angle={0.5} intensity={500} color="#6a00ff" />

          <ambientLight intensity={0.5} color="white" />

          <Environment preset="studio" blur={1} />



          <Carousel setFocus={setFocus} focusIndex={focusIndex} />

          {focusIndex === null && <MainTitle visible={true} />}

         

          <Sparkles count={300} scale={20} size={3} speed={0.4} opacity={0.4} color="#ff3300" />

          <DynamicEffects />

        </Canvas>

      </div>

     

      {/* FOOTER */}

      {/*<div style={{

          position: 'absolute', bottom: '30px', width: '100%', textAlign: 'center',

          color: '#555', fontFamily: 'sans-serif', fontSize: '12px', pointerEvents: 'none',

          opacity: 0.7, zIndex: 10

      }}>

          DRAG TO SPIN • CLICK ALBUM TO ENTER

      </div>*/}



    </div>

  )

}