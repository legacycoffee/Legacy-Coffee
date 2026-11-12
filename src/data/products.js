export const products = [
  {
    id: 'legacy-coffee',
    name: 'Legacy Coffee',
    weight: '250g',
    price: 15000,
    description: 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
    details: 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
    tastingNotes: '',
    roast: 'Roasted Ground Coffee',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1794320831/products/legacy-coffee.png',
    imageAlt: 'Legacy Coffee',
  },
  {
    id: 'legacy-coffee-500g',
    name: 'Legacy Coffee',
    weight: '500g',
    price: 25000,
    description: 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
    details: 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
    tastingNotes: '',
    roast: 'Roasted Ground Coffee',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380654/products/legacy-coffee-500g.png',
    imageAlt: 'Legacy Coffee 500g',
  },
  {
    id: 'legacy-coffe',
    name: 'Legacy Coffee',
    weight: '1 Kg',
    price: 50000,
    description: 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
    details: 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
    tastingNotes: '',
    roast: 'Roasted Ground Coffee',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380973/products/legacy-coffe.png',
    imageAlt: 'Legacy Coffee 1 Kg',
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

export function formatProductPrice(price) {
  return price == null ? 'Price on request' : formatPrice(price)
}
