import _ from 'lodash'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'

export const Pomodoro = () => {
    const activityWindow = 25
    const breakWindow = 30 - activityWindow

    const [stage, setStage] = useState('')
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)
    const [milliseconds, setMilliseconds] = useState(0)

    let updateTimer = () => {
        let now = DateTime.now()
        let currentMinutes = now.toFormat('mm')
        let currentSeconds = now.toFormat('ss')
        let currentMilliseconds = now.toFormat('SSS')

        let countdownMinutes = activityWindow - (currentMinutes % 30) - 1

        let countdownSeconds = Math.max(0, 60 - currentSeconds)
        let countdownMilliseconds = Math.max(0, 1000 - currentMilliseconds)

        let breakMinutes = Math.min(breakWindow, 29 - (currentMinutes % 30))
        // let breakMinutes = currentMinutes

        if (countdownMinutes > -1) {
            setMinutes(countdownMinutes)
            setStage('Activity')
        } else {
            setMinutes(breakMinutes)
            setStage('Break')
        }
        setSeconds(countdownSeconds)
        setMilliseconds(countdownMilliseconds)

        // let pomTimeLeft =
        // setTimeout(updateTimer(), 0.5)
    }

    useEffect(() => {
        const interval = setInterval(updateTimer, 100)

        return () => clearInterval(interval)
    })

    return (
        <div className="full-page">
            <div className="timer">
                <div className="timer__stage">{stage}</div>
                <div className="timer__time">
                    <div className="timer__minutes">
                        {_.padStart(minutes, 2, '0')}
                    </div>
                    <div className="timer__label">
                        minute{minutes != 1 && <span>s</span>} &
                    </div>
                    <div className="timer__seconds">
                        {_.padStart(seconds, 2, '0')}
                    </div>
                    <div className="timer__label">seconds left</div>
                </div>
            </div>
        </div>
    )
}

export default Pomodoro
