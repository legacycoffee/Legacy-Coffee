export const products = [
  {
    id: 'single-origin-arabica',
    name: 'Single Origin Arabica',
    weight: '1kg',
    price: 50000,
    description: 'A light roast with bright fruity notes from the Kyenjojo highlands.',
    details: 'Grown by smallholder farmers in Western Uganda and carefully roasted to highlight its naturally sweet, fruit-forward character.',
    tastingNotes: 'Citrus, red berries, and honey',
    roast: 'Light roast',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=85',
    imageAlt: 'Freshly brewed coffee beside coffee beans',
  },
  {
    id: 'robusta-blend',
    name: 'Robusta Blend',
    weight: '500g',
    price: 25000,
    description: 'Bold and earthy, with a rich body that is perfect for espresso lovers.',
    details: 'A full-bodied Ugandan Robusta blend with a deep aroma and a satisfying finish. Delicious as espresso or in milk-based drinks.',
    tastingNotes: 'Dark chocolate, toasted nuts, and spice',
    roast: 'Dark roast',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=900&auto=format&fit=crop&q=85',
    imageAlt: 'Roasted coffee beans ready to brew',
  },
  {
    id: 'roasted-ground-coffee',
    name: 'Roasted Ground Coffee',
    weight: '250g',
    price: 15000,
    description: 'Ready-to-brew medium roast coffee, smooth and balanced.',
    details: 'Freshly roasted and ground for an easy, dependable brew. Enjoy it in a French press, filter, or drip coffee maker.',
    tastingNotes: 'Caramel, cocoa, and gentle citrus',
    roast: 'Medium roast',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=900&auto=format&fit=crop&q=85',
    imageAlt: 'A cup of freshly brewed medium roast coffee',
  },
  {
    id: 'coffee-seedlings',
    name: 'Coffee Seedlings',
    weight: '1 seedling',
    price: 2000,
    description: 'High quality, nationally approved coffee seedlings to help you maximise your investment in coffee farming.',
    details: 'These nationally approved varieties are drought and disease resistant. Orders above 1,000 seedlings receive a 5% discount.',
    tastingNotes: 'N/A',
    roast: 'N/A',
    image: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg',
    imageAlt: 'Coffee farm in Uganda',
  },
]

export function getCartItemUnitPrice(item) {
  return item.id === 'coffee-seedlings' && item.quantity > 1000
    ? Math.round(item.price * 0.95)
    : item.price
}

export function formatPrice(price) {
  return `UGX ${new Intl.NumberFormat('en-UG', {
    maximumFractionDigits: 0,
  }).format(price)}`
}
