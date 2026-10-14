/**
 * Kills headless Chrome processes that nothing owns any more.
 *
 * `components/nba-court/live/nba-browser.js` keeps one pooled browser and
 * kills it on exit, so in normal use there is nothing here to find. This is
 * for the cases that skip exit handlers entirely — `kill -9`, a crash, a
 * machine sleep that strands the child. `puppeteer.launch()` detaches the
 * browser, so a stranded one survives its parent indefinitely: this project
 * accumulated 424 of them across two days, holding 22GB, discovered only
 * because the laptop ran out of memory.
 *
 * Runs as `predev`, so every `npm run dev` starts from a clean slate.
 *
 * Three conditions, all required, so this can never take out a browser that
 * is actually in use — including another project's, or a debugging session
 * running alongside this one:
 *
 *   1. `--headless`, so no interactive browser is ever a candidate.
 *   2. a `--user-data-dir` under a temp directory, which is automation's
 *      throwaway profile and never a real one.
 *   3. PPID 1, meaning the process that launched it is gone. A live
 *      automation session still has its parent, so it is never matched.
 */
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'

/** macOS reports `/var/folders/...`; `tmpdir()` resolves to `/private/var/...`. */
const TEMP_ROOTS = [tmpdir(), tmpdir().replace(/^\/private/, ''), '/tmp']

function listCandidates() {
    const out = execFileSync('ps', ['-Ao', 'pid=,ppid=,command='], { encoding: 'utf8' })
    const found = []
    for (const line of out.split('\n')) {
        const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/)
        if (!match) continue
        const [, pid, ppid, command] = match
        if (!command.includes('--headless')) continue
        // A renderer/GPU child dies with its parent; only target the browser.
        if (/--type=/.test(command)) continue
        if (Number(ppid) !== 1) continue
        const dir = command.match(/--user-data-dir=(\S+)/)?.[1]
        if (!dir || !TEMP_ROOTS.some((root) => dir.startsWith(root))) continue
        found.push(Number(pid))
    }
    return found
}

const pids = listCandidates()
if (!pids.length) {
    console.log('reap: no orphaned headless browsers')
} else {
    let killed = 0
    for (const pid of pids) {
        try {
            process.kill(pid, 'SIGKILL')
            killed += 1
        } catch {
            // Already gone between listing and killing.
        }
    }
    console.log(`reap: killed ${killed} orphaned headless browser${killed === 1 ? '' : 's'}`)
}
