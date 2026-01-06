import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { palettes } from '../utils/colorUtils'

const SketchLogo = () => {
    // Sketch logo state
    let speed = 8
    let iterations = 24
    let jDecay = Math.random() * .05 + 1.2
    let tDecay = Math.random() * .05 + 1.2
    let dDecay = Math.random() * .05 + 1.2
    var jStep = 0
    var tStep = 0
    var dStep = 0
    const jLength = 5
    const tLength = 8
    const dLength = 6
    const [jIndex, setJindex] = useState(0)
    const [tIndex, setTindex] = useState(0)
    const [dIndex, setDindex] = useState(0)

    const randomizeOneLetter = (length, setter) => {
        let selectedSketchIndex = Math.floor(Math.random() * length)
        setter(selectedSketchIndex)
    }

    const randomCycle = (randomizer, decay, stepVar) => {
        var step = stepVar
        randomizer()
        if (step < iterations) {
            step++
            setTimeout(() => randomCycle(randomizer, decay, step), speed * step ** decay)
        }
    }

    const startCycles = () => {
        randomCycle(() => randomizeOneLetter(jLength, setJindex), jDecay, jStep)
        randomCycle(() => randomizeOneLetter(tLength, setTindex), tDecay, tStep)
        randomCycle(() => randomizeOneLetter(dLength, setDindex), dDecay, dStep)
    }

    useEffect(() => {
        startCycles()
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
                        fill={palettes['caribbean-green'][5].value}
                    />
                    <path
                        d="M190.007 65.1805C189.563 62.6726 191.243 60.281 193.758 59.8388L314.723 38.5708C317.238 38.1286 319.637 39.8032 320.08 42.3111L329.942 98.0785C330.385 100.586 328.706 102.978 326.191 103.42L300.504 107.936C299.246 108.158 298.406 109.353 298.628 110.607L308.891 168.645C309.335 171.153 307.655 173.545 305.14 173.987L249.212 183.82C246.696 184.262 244.298 182.588 243.855 180.08L233.591 122.042C233.37 120.788 232.17 119.951 230.913 120.172L205.226 124.688C202.71 125.13 200.312 123.456 199.868 120.948L190.007 65.1805Z"
                        fill={palettes['navy-blue'][6].value}
                    />
                    <path
                        d="M349.434 45.1558L409.917 55.7898C445.835 62.105 469.819 96.2586 463.486 132.074C457.152 167.889 422.9 191.804 386.981 185.489L326.498 174.855C323.983 174.412 322.304 172.021 322.747 169.513L344.077 48.8961C344.52 46.3882 346.919 44.7136 349.434 45.1558Z"
                        fill={palettes['sunset-red'][5].value}
                    />
                </svg>
                <div
                    className="sketch-logo__letter-stack"
                    style={{
                        marginLeft: `${-100 * jIndex}%`,
                        width: `${100 * jLength}%`,
                    }}
                >
                    <Image
                        src={`/j/Cookie.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/j/Dog.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/j/Flamingo.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/j/Lego.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/j/Sneaker.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                </div>
                <div
                    className="sketch-logo__letter-stack"
                    style={{
                        marginLeft: `${-100 * tIndex}%`,
                        width: `${100 * tLength}%`,
                    }}
                >
                    <Image
                        src={`/t/Birdhouse.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Groucho.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/MushroomCloud.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Music.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Screw.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Skull.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Spaceman.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/t/Umbrella.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                </div>
                <div
                    className="sketch-logo__letter-stack"
                    style={{
                        marginLeft: `${-100 * dIndex}%`,
                        width: `${100 * dLength}%`,
                    }}
                >
                    <Image
                        src={`/d/B-Ball.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/d/Bowling.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/d/Burger.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/d/Island.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/d/Mug.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                    <Image
                        src={`/d/Pencil.png`}
                        className="sketch-logo__sketch-letter"
                        width="520"
                        height="230"
                        alt="Sketched letter overlay"
                    />
                </div>
            </div>
        </div>
    )
}

export default SketchLogo
