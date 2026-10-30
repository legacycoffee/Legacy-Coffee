import { createReadableSlug } from './createReadableSlug.js'

export function getProductUrl(product) {
  const identifier = product.public_id || product.id
  const suffix = product.public_id
    ? `/${createReadableSlug(product.name)}`
    : ''

  return `/products/${encodeURIComponent(identifier)}${suffix}`
}
