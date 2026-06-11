import Image from 'next/image'
import { useEffect, useState } from 'react'

const J_IMAGES = ['/j/Cookie.png', '/j/Dog.png', '/j/Flamingo.png', '/j/Lego.png', '/j/Sneaker.png']
const T_IMAGES = ['/t/Birdhouse.png', '/t/Groucho.png', '/t/MushroomCloud.png', '/t/Music.png', '/t/Screw.png', '/t/Skull.png', '/t/Spaceman.png', '/t/Umbrella.png']
const D_IMAGES = ['/d/B-Ball.png', '/d/Bowling.png', '/d/Burger.png', '/d/Island.png', '/d/Mug.png', '/d/Pencil.png']

const TRANSITION = 'opacity 0.075s ease-out, filter 0.075s ease-out, transform 0.075s ease-out'

function frameStyle(active) {
    return {
        position: 'absolute',
        inset: 0,
        opacity: active ? 1 : 0,
        filter: active ? 'blur(0px)' : 'blur(4px)',
        transform: active ? 'translateY(0)' : 'translateY(8px)',
        transition: TRANSITION,
        pointerEvents: 'none',
    }
}

function LetterStack({ images, activeIndex }) {
    return (
        <div className="sketch-logo__letter-stack">
            {images.map((src, i) => (
                <div key={src} style={frameStyle(i === activeIndex)}>
                    <Image
                        src={src}
                        className="sketch-logo__sketch-letter"
                        width={520}
                        height={230}
                        alt="Sketched letter overlay"
                    />
                </div>
            ))}
        </div>
    )
}

const SketchLogo = () => {
    const speed = 8
    const iterations = 24

    const [jIndex, setJindex] = useState(0)
    const [tIndex, setTindex] = useState(0)
    const [dIndex, setDindex] = useState(0)

    const randomCycle = (length, setter, decay, step = 0) => {
        setter(Math.floor(Math.random() * length))
        if (step < iterations) {
            setTimeout(() => randomCycle(length, setter, decay, step + 1), speed * (step + 1) ** decay)
        }
    }

    const startCycles = () => {
        randomCycle(J_IMAGES.length, setJindex, Math.random() * 0.05 + 1.2)
        randomCycle(T_IMAGES.length, setTindex, Math.random() * 0.05 + 1.2)
        randomCycle(D_IMAGES.length, setDindex, Math.random() * 0.05 + 1.2)
    }

    useEffect(() => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            startCycles()
        }
    }, [])

    return (
        <div className="sketch-logo" onClick={startCycles}>
            <div className="sketch-logo__letters">
                <svg
                    className="sketch-logo__letters-backdrop"
                    width="20em"
                    viewBox="0 0 520 230"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M117.866 59.4844C117.732 56.9413 119.692 54.7716 122.242 54.6383L178.956 51.6746C181.506 51.5414 183.682 53.4949 183.816 56.0381L187.03 117.193C188.939 153.511 160.96 184.495 124.537 186.399C89.6663 188.221 59.6986 162.728 55.532 128.683C55.2226 126.155 57.1982 123.977 59.7487 123.844L118.771 120.76C120.047 120.693 121.026 119.608 120.959 118.337L117.866 59.4844Z"
                        fill="white"
                    />
                    <path
                        d="M190.007 65.1805C189.563 62.6726 191.243 60.281 193.758 59.8388L314.723 38.5708C317.238 38.1286 319.637 39.8032 320.08 42.3111L329.942 98.0785C330.385 100.586 328.706 102.978 326.191 103.42L300.504 107.936C299.246 108.158 298.406 109.353 298.628 110.607L308.891 168.645C309.335 171.153 307.655 173.545 305.14 173.987L249.212 183.82C246.696 184.262 244.298 182.588 243.855 180.08L233.591 122.042C233.37 120.788 232.17 119.951 230.913 120.172L205.226 124.688C202.71 125.13 200.312 123.456 199.868 120.948L190.007 65.1805Z"
                        fill="white"
                    />
                    <path
                        d="M349.434 45.1558L409.917 55.7898C445.835 62.105 469.819 96.2586 463.486 132.074C457.152 167.889 422.9 191.804 386.981 185.489L326.498 174.855C323.983 174.412 322.304 172.021 322.747 169.513L344.077 48.8961C344.52 46.3882 346.919 44.7136 349.434 45.1558Z"
                        fill="white"
                    />
                </svg>
                <LetterStack images={J_IMAGES} activeIndex={jIndex} />
                <LetterStack images={T_IMAGES} activeIndex={tIndex} />
                <LetterStack images={D_IMAGES} activeIndex={dIndex} />
            </div>
        </div>
    )
}

export default SketchLogo
