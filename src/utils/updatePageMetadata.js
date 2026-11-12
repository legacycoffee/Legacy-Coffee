import { getCanonicalUrl } from '../data/seoPages.js'

function setMeta(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.append(meta)
  }
  meta.setAttribute('content', content)
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.append(link)
  }
  link.setAttribute('href', url)
}

function removeCanonical() {
  document.head.querySelector('link[rel="canonical"]')?.remove()
}

export function updatePageMetadata(page) {
  document.title = page.title
  setMeta('name', 'description', page.description)
  if (page.keywords) setMeta('name', 'keywords', page.keywords)
  else removeMeta('name', 'keywords')

  setMeta('property', 'og:type', page.type || 'website')
  setMeta('property', 'og:site_name', 'Legacy Coffee')
  setMeta('property', 'og:url', getCanonicalUrl(window.location.pathname))
  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:image', page.image)
  setMeta('property', 'og:image:alt', page.imageAlt || 'Legacy Coffee in Uganda')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)
  setMeta('name', 'twitter:image', page.image)

  if (page.robots) setMeta('name', 'robots', page.robots)
  else removeMeta('name', 'robots')

  if (page.robots?.includes('noindex')) removeCanonical()
  else setCanonical(getCanonicalUrl(window.location.pathname))
}