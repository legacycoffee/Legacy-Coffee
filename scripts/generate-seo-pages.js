import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { privateSeoPages, seoPages } from '../src/data/seoPages.js'

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const template = await readFile(path.join(distDirectory, 'index.html'), 'utf8')
const siteOrigin = 'http://legacycoffee.org'

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
}

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
}

function setMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i')
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function removeMeta(html, attribute, key) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i')
  return html.replace(pattern, '')
}

function renderMetadata(page) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(page.title)}</title>`)
  html = setMeta(html, 'name', 'description', page.description)
  html = page.keywords
    ? setMeta(html, 'name', 'keywords', page.keywords)
    : removeMeta(html, 'name', 'keywords')
  html = setMeta(html, 'property', 'og:type', page.type || 'website')
  html = setMeta(html, 'property', 'og:site_name', 'Legacy Coffee')
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'property', 'og:image', page.image)
  html = setMeta(html, 'property', 'og:image:alt', page.imageAlt || 'Legacy Coffee in Uganda')
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
  html = setMeta(html, 'name', 'twitter:title', page.title)
  html = setMeta(html, 'name', 'twitter:description', page.description)
  html = setMeta(html, 'name', 'twitter:image', page.image)
  html = page.robots
    ? setMeta(html, 'name', 'robots', page.robots)
    : removeMeta(html, 'name', 'robots')
  return html
}

async function writeRoutePage(page) {
  const route = page.path.replace(/^\/+|\/+$/g, '')
  const outputPath = route
    ? path.join(distDirectory, route, 'index.html')
    : path.join(distDirectory, 'index.html')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, renderMetadata(page))
}

for (const page of seoPages) {
  await writeRoutePage(page)
}

for (const page of privateSeoPages) {
  await writeRoutePage({
    ...seoPages[0],
    ...page,
    keywords: undefined,
    robots: 'noindex,nofollow',
  })
}

const sitemapUrls = seoPages.map(page => {
  const route = page.path === '/' ? '/' : `${page.path.replace(/\/+$/, '')}/`
  return `  <url>\n    <loc>${siteOrigin}${route}</loc>\n  </url>`
})

await writeFile(
  path.join(distDirectory, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`,
)

console.log(`Generated static SEO metadata for ${seoPages.length + privateSeoPages.length} routes.`)
