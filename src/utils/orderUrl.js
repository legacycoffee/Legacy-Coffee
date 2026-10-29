import { createReadableSlug } from './createReadableSlug.js'

export function getOrderUrl(order) {
  const orderName = order.items
    .map(item => item.product_name || item.name)
    .filter(Boolean)
    .join(' ')

  return `/my-orders/${encodeURIComponent(order.public_id)}/${createReadableSlug(orderName)}`
}
