import { formatPrice, getCartItemUnitPrice } from '../data/products.js'

const ORDER_WHATSAPP_NUMBER = '256789069263'

export function getWhatsAppOrderUrl(items, customer = {}, seedlingType = '') {
  const lines = items.map(item => {
    const unitPrice = getCartItemUnitPrice(item)
    const wholesaleLabel = item.is_wholesale ? ' (wholesale)' : ''
    return `- ${item.name} (${item.weight})${wholesaleLabel}: ${item.quantity} x ${formatPrice(unitPrice)} = ${formatPrice(unitPrice * item.quantity)}`
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
    customer.address && `Delivery address: ${customer.address}${customer.city ? `, ${customer.city}` : ''}`,
    seedlingType.trim() && `Seedling type: ${seedlingType.trim()}`,
    customer.notes && `Delivery notes: ${customer.notes}`,
  ].filter(Boolean)

  const message = [
    'Hi Legacy Coffee, I would like to place this order:',
    ...lines,
    `Estimated product total: ${formatPrice(total)}`,
    'Please confirm product availability, current prices, and delivery fee before payment.',
    customerDetails.length ? `\nCustomer details:\n${customerDetails.join('\n')}` : '',
    '\nIf I already submitted this order on the website, please check before processing it again.',
  ].filter(Boolean).join('\n')

  return `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
