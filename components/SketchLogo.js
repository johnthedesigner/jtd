import Image from 'next/image'
import { useState } from 'react'

const SketchLogo = () => {
    const jArray = ['Cookie', 'Dog', 'Flamingo', 'Lego', 'Sneaker']
    const tArray = [
        'Birdhouse',
        'Groucho',
        'MushroomCloud',
        'Music',
        'Skull',
        'Spaceman',
        'Umbrella',
    ]
    const dArray = ['B-Ball', 'Bowling', 'Burger', 'Island', 'Mug', 'Pencil']

    const [j, setJ] = useState('Cookie')
    const [t, setT] = useState('Groucho')
    const [d, setD] = useState('Pencil')

    const randomizeSketches = async () => {
        let sketches = [j, t, d]
        let setters = [setJ, setT, setD]
        let arrays = [jArray, tArray, dArray]

        let selectedLetter = Math.floor(Math.random() * 3)

        let selectedSketchIndex = Math.floor(
            Math.random() * arrays[selectedLetter].length
        )
        let selectedSketch = arrays[selectedLetter][selectedSketchIndex]

        if (selectedSketch === sketches[selectedLetter]) {
            if (selectedSketchIndex + 1 === arrays[selectedLetter].length) {
                selectedSketch = arrays[selectedLetter][selectedSketchIndex - 1]
            } else {
                selectedSketch = arrays[selectedLetter][selectedSketchIndex + 1]
            }
        }

        await setters[selectedLetter](selectedSketch)
    }

    // Loop through random sketches
    let speed = 12
    let iterations = 27
    var step = 0
    const triggerRandomize = () => {
        randomizeSketches()
        if (step < iterations) {
            step++
            setTimeout(triggerRandomize, speed * step ** 1.03)
        }
    }

    useState(() => {
        triggerRandomize()
    })

    const sketchLetterStyles = {
        width: '100%',
        height: 'auto',
        position: 'absolute',
        pointerEvents: 'none',
    }

    const SketchLetter = ({ nameState, letter, name }) => {
        let hidden = nameState != name
        return (
            <Image
                src={`/${letter}/${name}.png`}
                className="sketch-logo__sketch-letter"
                width="520"
                height="230"
                style={{
                    ...sketchLetterStyles,
                    opacity: hidden ? 0 : 1,
                }}
                alt="Sketched letter overlay"
            />
        )
    }

    return (
        <div
            className="sketch-logo"
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '520/230',
            }}
            onClick={triggerRandomize}
        >
            <div className="sketch-logo__letters">
                <svg
                    width="520"
                    height="230"
                    viewBox="0 0 520 230"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={sketchLetterStyles}
                >
                    <path
                        d="M190.007 65.1805C189.563 62.6726 191.243 60.281 193.758 59.8388L314.723 38.5708C317.238 38.1286 319.637 39.8032 320.08 42.3111L329.942 98.0785C330.385 100.586 328.706 102.978 326.191 103.42L300.504 107.936C299.246 108.158 298.406 109.353 298.628 110.607L308.891 168.645C309.335 171.153 307.655 173.545 305.14 173.987L249.212 183.82C246.696 184.262 244.298 182.588 243.855 180.08L233.591 122.042C233.37 120.788 232.17 119.951 230.913 120.172L205.226 124.688C202.71 125.13 200.312 123.456 199.868 120.948L190.007 65.1805Z"
                        fill="#FACA6B"
                    />
                    <path
                        d="M117.866 59.4844C117.732 56.9413 119.692 54.7716 122.242 54.6383L178.956 51.6746C181.506 51.5414 183.682 53.4949 183.816 56.0381L187.03 117.193C188.939 153.511 160.96 184.495 124.537 186.399C89.6663 188.221 59.6986 162.728 55.532 128.683C55.2226 126.155 57.1982 123.977 59.7487 123.844L118.771 120.76C120.047 120.693 121.026 119.608 120.959 118.337L117.866 59.4844Z"
                        fill="#F07D7D"
                    />
                    <path
                        d="M349.434 45.1558L409.917 55.7898C445.835 62.105 469.819 96.2586 463.486 132.074C457.152 167.889 422.9 191.804 386.981 185.489L326.498 174.855C323.983 174.412 322.304 172.021 322.747 169.513L344.077 48.8961C344.52 46.3882 346.919 44.7136 349.434 45.1558Z"
                        fill="#5F9DF2"
                    />
                </svg>
                <SketchLetter nameState={j} letter="j" name="Baby" />
                <SketchLetter nameState={j} letter="j" name="Cookie" />
                <SketchLetter nameState={j} letter="j" name="Dog" />
                <SketchLetter nameState={j} letter="j" name="Flamingo" />
                <SketchLetter nameState={j} letter="j" name="Lego" />
                <SketchLetter nameState={j} letter="j" name="Sneaker" />
                <SketchLetter nameState={t} letter="t" name="Birdhouse" />
                <SketchLetter nameState={t} letter="t" name="Groucho" />
                <SketchLetter nameState={t} letter="t" name="MushroomCloud" />
                <SketchLetter nameState={t} letter="t" name="Music" />
                <SketchLetter nameState={t} letter="t" name="Pizza" />
                <SketchLetter nameState={t} letter="t" name="Screw" />
                <SketchLetter nameState={t} letter="t" name="Skull" />
                <SketchLetter nameState={t} letter="t" name="Spaceman" />
                <SketchLetter nameState={t} letter="t" name="Umbrella" />
                <SketchLetter nameState={d} letter="d" name="B-Ball" />
                <SketchLetter nameState={d} letter="d" name="Bowling" />
                <SketchLetter nameState={d} letter="d" name="Burger" />
                <SketchLetter nameState={d} letter="d" name="Island" />
                <SketchLetter nameState={d} letter="d" name="Mitt" />
                <SketchLetter nameState={d} letter="d" name="Mug" />
                <SketchLetter nameState={d} letter="d" name="Pencil" />
            </div>
        </div>
    )
}

export default SketchLogo
