/**
 * The site's own origin, for the absolute URLs crawlers and social cards
 * need — canonical links and `og:image` are both ignored or mis-resolved
 * when they are relative.
 *
 * `DOMAIN`/`PROTOCOL` already exist for the sitemap, but those are read in
 * `getServerSideProps` and so are server-only; anything rendered into a
 * page's `<Head>` needs the value at build time, which in the pages router
 * means a `NEXT_PUBLIC_` variable. The default is here so the site is
 * correct without one being set, and the variable is there so a preview
 * deployment can point at itself.
 */
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://johnthedesigner.com'
).replace(/\/$/, '')

/** An absolute URL for a site-root-relative path. */
export function absoluteUrl(path = '/') {
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
