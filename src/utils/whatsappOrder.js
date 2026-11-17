import { formatPrice, getCartItemUnitPrice } from '../data/products.js'
import { formatSeedlingVarieties, getSeedlingVarietyBreakdown } from './seedlings.js'

const ORDER_WHATSAPP_NUMBER = '256789069263'

export function getWhatsAppContactUrl() {
  return `https://wa.me/${ORDER_WHATSAPP_NUMBER}`
}

export function getWhatsAppOrderUrl(items, customer = {}, seedlingType = '') {
  const selectedSeedlings = formatSeedlingVarieties(getSeedlingVarietyBreakdown(items)) || seedlingType.trim()
  const itemLines = items.flatMap((item, index) => {
    const unitPrice = getCartItemUnitPrice(item)
    const productType = item.roast || item.coffee_type
    const productDescription = [item.name, productType].filter(Boolean).join(' — ')
    const wholesaleLabel = item.is_wholesale ? ' (wholesale)' : ''
    return [
      `${index + 1}. ${productDescription} (${item.weight})${wholesaleLabel}`,
      `   ${item.quantity} × ${formatPrice(unitPrice)}  —  ${formatPrice(unitPrice * item.quantity)}`,
    ]
  })
  const total = items.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item) * item.quantity,
    0,
  )
  const customerDetails = [
    customer.name && `Name: ${customer.name}`,
    customer.business_name && `Business: ${customer.business_name}`,
    customer.phone && `Phone: ${customer.phone}`,
    customer.email && `Email: ${customer.email}`,
    customer.address && `Address: ${customer.address}${customer.city ? `, ${customer.city}` : ''}`,
    customer.notes && `Delivery notes: ${customer.notes}`,
  ].filter(Boolean)

  const itemSection = [
    'ORDER ITEMS',
    ...itemLines,
    selectedSeedlings ? `   Seedling varieties: ${selectedSeedlings}` : null,
  ].filter(line => line !== null).join('\n')
  const totalSection = [
    '━━━━━━━━━━━━━━━━━━━━',
    `PRODUCTS TOTAL: ${formatPrice(total)}`,
    'Delivery fee: To be confirmed',
  ].join('\n')
  const customerSection = customerDetails.length
    ? ['CUSTOMER DETAILS', ...customerDetails].join('\n')
    : null
  const message = [
    ['LEGACY COFFEE — ORDER REQUEST', '━━━━━━━━━━━━━━━━━━━━'].join('\n'),
    itemSection,
    totalSection,
    customerSection,
    'Please confirm availability, final prices, and delivery fee before payment.',
  ].filter(Boolean).join('\n\n')

  return `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
