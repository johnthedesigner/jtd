/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allow mixed JS/TS during migration
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  /**
   * `@sparticuz/chromium` ships a real Chromium binary alongside its JS and
   * resolves it by walking out from its own file location. Bundling it
   * relocates the JS and leaves the binary behind, so on Vercel the NBA
   * routes failed with "The input directory /var/task/node_modules/
   * @sparticuz/chromium/bin does not exist" — the package's own words for
   * exactly this. It has to stay external and be traced into the function
   * as a real dependency.
   *
   * `puppeteer-core` goes with it: it is the thing that launches that
   * binary, and bundling the two apart has its own ways of going wrong.
   */
  /**
   * The court experiment is called Courtside now. The old path was shared
   * while it was being built, so it keeps working — permanently, since
   * the new name is the one that will last.
   */
  async redirects() {
      return [
          {
              source: '/experiments/nba-court',
              destination: '/experiments/courtside',
              permanent: true,
          },
      ]
  },
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  /**
   * ...and externalizing alone is not enough. The package resolves its
   * binary by walking out from its own file location to `bin/`, which the
   * file tracer never sees because nothing `require`s those files — they
   * are data, not modules. Checked against the build's own trace: six JS
   * files from the package were included and **zero** from `bin/`, which is
   * exactly the deployed error ("the input directory .../bin does not
   * exist").
   *
   * The four archives there total ~67MB compressed, which fits inside
   * Vercel's 250MB uncompressed function limit but is most of the budget —
   * so this is scoped to the routes that actually launch a browser rather
   * than applied to every function in the app.
   */
  outputFileTracingIncludes: {
    // A glob, not one key per route: the literal dynamic-route key
    // `/api/nba-live/summary/[gameId]` silently matched nothing, and a
    // missing include looks identical to a working one until the function
    // actually tries to launch a browser.
    '/api/nba-live/**': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
}

module.exports = nextConfig
