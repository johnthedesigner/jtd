import _ from 'lodash'
import axios from 'axios'

import pages from '../utils/pages'

const getDate = new Date().toISOString()

const Sitemap = () => {
    return null
}

const buildSitemap = (siteDomain, protocol) => {
    const staticPages = _.map(pages, (page) => {
        if (page.inSitemap) {
            return `
            <url>
              <loc>${protocol}://${siteDomain}${page.path}</loc>
              <lastmod>${getDate}</lastmod>
            </url>
          `
        } else {
            return null
        }
    }).join('')

    return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${staticPages}
    </urlset>`
}

export const getServerSideProps = async ({ res }) => {
    const { DOMAIN, PROTOCOL } = process.env

    let sitemap = buildSitemap(DOMAIN, PROTOCOL)

    res.setHeader('Content-Type', 'text/xml')
    res.write(sitemap)
    res.end()

    return {
        props: {},
    }
}

export default Sitemap
